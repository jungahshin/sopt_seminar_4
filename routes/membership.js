//실습코드
var express = require('express');
var router = express.Router();
const util = require('../module/utils');
const statusCode = require('../module/statusCode');
const resMessage = require('../module/responseMessage');
const mysql = require('../config/dbConfig');

router.get('/:gender', (req, res) => {
    const selectGenderQuery = 'SELECT * FROM sopt WHERE gender = ?';//여자면 1, 남자면 0

    mysql.getConnection((err, connection) => {
        //console.log("hi");
        connection.query(selectGenderQuery, [parseInt(req.params.gender)], (err, result) => {
            if (err) {//connection.query실패
                res.status(200).send(util.successFalse(statusCode.INTERNAL_SERVER_ERROR, resMessage.NO_CONNECTION));
            } else {//connection.query성공&result가 빈 값이 아닐 때
                if(result.length != 0){
                    console.log(result);
                    res.status(200).send(util.successTrue(statusCode.OK, resMessage.QUERY_SELECT_SUCCESS, result));
                    connection.release();//connection.release()를 query를 날린 콜백함수 안에 해주어야 한다! 결과 나온 이후!!
                }else{//connection.query성공 but result가 빈 값 일때
                    console.log(result);
                    res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.NO_GENDER));
                    connection.release();
                }
            }
        });
        //connection.release(); 잘못된 위치!!!
        //release와 query 둘 다 비동기적으로 처리되기 때문에 query 날리기 전에 connection 반납될 수 있음
    });
});

module.exports = router;
