const express = require('express');
const jwt = require('jsonwebtoken');
const md5 = require('blueimp-md5');

const User = require('../models/User');
const Role = require('../models/Role');
const logger = require('../utils/logger');
const { SECRET } = require('../config/security');
const router = express.Router();

// login
router.post('/', (req, res, next) => {
	const { username, password } = req.body;
	User.findOne({ username, password: md5(password) }, { password: 0, __v: 0 })
		.then(user => {
			if (user) {
				console.log(`>>> Action: Login(${username})`);
				logger.writeLoginEntry('successfully', username);

				const token = jwt.sign({ id: user._id }, SECRET, {
					expiresIn: '7 days',
				});

				if (user.role_id) {
					Role.findOne({ _id: user.role_id }).then(role => {
						if (!role) role = { menus: [] };
						user._doc.role = role;
						res.send({
							status: 0,
							data: {
								user,
								token,
							},
						});
					});
				} else {
					role = { menus: [] };
					res.send({
						status: 0,
						data: {
							user,
							token,
						},
					});
				}
			} else {
				console.log(`>>> Warning: Login failed(${username})`);
				logger.writeLoginEntry('failed', username);
				res.send({ status: 1, msg: 'Username and password not match' });
			}
		})
		.catch(error => {
			console.log('### Exception: Login\n', error);
			logger.writeLoginEntry('exception', username, error);
			logger.writeExceptionEntry('Login', error);
			res.send({ status: 1, msg: 'Exception occurs when login' });
		});
});

module.exports = router;
