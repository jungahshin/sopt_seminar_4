var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');

//회원가입
//저장 시 같은 아이디가 있을 경우 실패 메시지 반환, pw를 해싱한 salt값도 같이 저장, pw는 반드시 해싱한 값으로 저장!
//body-id, name, password로 post
//저장할 정보-userIdx(자동생성?-auto_increment), id, name, password, salt

router.post('/', async(req, res) => {
    
    var signupFunc=async function(){//회원가입 함수
        const salt = await crypto.randomBytes(32);
        const salt_final = salt.toString('base64');
        const hashedPwd = await crypto.pbkdf2((req.body.password).toString(), salt_final, 1000, 32, 'SHA512');
        const hashedPwd_final = hashedPwd.toString('base64');
        const insertUserQuery = 'INSERT INTO user (id, name, password, salt) VALUES (?, ?, ?, ?)';
        const insertUserResult = await db.queryParam_Parse(insertUserQuery, [req.body.id, req.body.name, hashedPwd_final, salt_final]);
        if (insertUserResult.length == 0) {//result가 비어있지 않으면
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.USER_INSERT_FAIL));//db 저장 실패(회원가입 실패)
        } else { //쿼리문이 성공했을 때
            res.status(200).send(util.successTrue(statusCode.OK, resMessage.USER_INSERT_SUCCESS));//db 저장 성공(회원가입 성공)
        }
    }
    
    const getUserQuery = 'SELECT * FROM user WHERE id = ?';
    const getUserResult = await db.queryParam_Parse(getUserQuery, [req.body.id]);
    if(getUserResult.length == 0){//결과가 있으면->실패 메세지 반환
        signupFunc();//일치하는 id 없으니 회원가입 진행
    }else {
        res.status(200).send(util.successFalse(statusCode.BAD_REQUEST, resMessage.SIGNUP_FAIL));//이미 id 존재(회원 가입 실패)
    }
});

module.exports = router;