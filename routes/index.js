var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/membership', require('./membership'));
router.use('/homework', require('./homework'));
router.use('/users', require('./users'));

module.exports = router;
