var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');

//로그인
//db에서 해당 아이디를 가진 로우의 salt값으로 post된 비밀번호를 해싱을 한 후 로우의 비밀번호여부 판단
//body- id, password
//응답받는 클라이언트는 존재하지 않는 id인지, 틀린 비밀번호인지 알 수 없게 처리
router.post('/', async(req, res) => {
    
    const getUserQuery = 'SELECT * FROM user WHERE id = ?';
    const getUserResult = await db.queryParam_Parse(getUserQuery, [req.body.id]);
    if(getUserResult.length == 0){//결과가 있으면->실패 메세지 반환
        //일치하는 id가 없음(로그인 실패->클라이언트가 존재하지 않는 id인지 모르게 응답)
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.LOGIN_FAIL_ID));//id불일치
    }else {//id일치함
        const getUserQuery_salt = 'SELECT salt FROM user WHERE id = ?';
        const getUserResult_salt = await db.queryParam_Parse(getUserQuery_salt, [req.body.id]);
        const getUserQuery_pw = 'SELECT password FROM user WHERE id = ?';
        const getUserResult_pw = await db.queryParam_Parse(getUserQuery_pw, [req.body.id]);
        const hashedPwd_= await crypto.pbkdf2((req.body.password).toString(), getUserResult_salt[0]['salt'], 1000, 32, 'SHA512');
        const hashedPwd_final = hashedPwd_.toString('base64');
        if(hashedPwd_final == getUserResult_pw[0]['password']){
            //id와 password둘다 일치-->로그인 성공 메세지
            const getUserQuery_userIdx = 'SELECT userIdx FROM user WHERE id = ?';
            const getUserResult_userIdx = await db.queryParam_Parse(getUserQuery_userIdx, [req.body.id]);
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.LOGIN_SUCCESS, getUserResult_userIdx[0]['userIdx']));//userIdx를 로그인할때 바로 보여주기!!
        } else {
            //id는 일치하나 password 불일치(로그인 실패->클라이언트가 틀린 비밀번호인지 모르게 응답)
            res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.LOGIN_FAIL_PASSWORD));//password불일치
        }
    }
});

module.exports = router;
