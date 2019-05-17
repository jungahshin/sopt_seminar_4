var express = require('express');
var router = express.Router();
const crypto = require('crypto-promise');
const util = require('../../module/utils');
const statusCode = require('../../module/statusCode');
const resMessage = require('../../module/responseMessage');
const db = require('../../module/pool');
const moment = require('moment');

//homework/board/ get방식
//저장되어 있는 모든 게시물 불러오기!
router.get('/', async(req, res) => {
    const getAllBoardQuery = 'SELECT * FROM board';
    const getAllBoardResult = await db.queryParam_None(getAllBoardQuery);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (getAllBoardResult == 0) { //쿼리문이 실패했을 때
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.USER_SELECT_FAIL));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.USER_SELECT_SUCCESS, getAllBoardResult));
    }
});

//homework/board/:idx get방식
//id 에 해당하는 게시물 불러오기!(boardIdx가 id와 일치하는 게시물)
router.get('/:idx', async(req, res) => {
    const getBoardQuery = 'SELECT * FROM board WHERE boardIdx= ?';
    const getBoardResult = await db.queryParam_Parse(getBoardQuery, [req.params.idx]);

    //쿼리문의 결과가 실패이면 null을 반환한다
    if (getBoardResult == 0) { //쿼리문이 실패했을 때
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.USER_SELECT_FAIL));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.USER_SELECT_SUCCESS, getBoardResult));
    }
});

//homework/board/ post방식
//게시물 저장
//body-title, content, boardPw, writer(글 작성자 id)
//글 작성자 id가 user 테이블에 없으면 작성 못하게 안해도 되나???
//저장할 정보-boardIdx, writer, title, content, writetime, boardPw, salt
router.post('/', async(req, res) => {
    const insertBoardQuery = 'INSERT INTO board (writer, title, content, writetime, boardPw, salt) VALUES (?, ?, ?, ?, ?, ?)';
    const writetime = moment().format("YYYY-MM-DD HH:mm:ss");
    const salt = await crypto.randomBytes(32);
    const salt_final = salt.toString('base64');
    const hashedPwd = await crypto.pbkdf2((req.body.boardPw).toString(), salt.toString('base64'), 1000, 32, 'SHA512');
    const hashedPwd_final = hashedPwd.toString('base64');
    const insertBoardResult = await db.queryParam_Parse(insertBoardQuery, [req.body.writer, req.body.title, req.body.content, writetime, hashedPwd_final, salt_final]);

    if (insertBoardResult == 0) {//쿼리문 실패(게시물 작성 실패)
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.BOARD_SAVE_FAIL));
    } else { //쿼리문이 성공했을 때
        res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_SAVE_SUCCESS));
    }
});

//게시물 삭제
//body:boardIdx
router.delete('/', async(req, res) => {
    const getBoardQuery = 'SELECT * FROM board WHERE boardIdx= ?';
    const getBoardResult = await db.queryParam_Parse(getBoardQuery, [req.body.boardIdx]);

    if (getBoardResult == 0) { //쿼리문이 실패했을 때(boardIdx가 없어)
        res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.BOARD_DELETE_FAIL));
    } else { //같은 boardIdx가 존재할 때
        const getBoardQuery_salt = 'SELECT salt FROM board WHERE boardIdx = ?';
        const getBoardResult_salt = await db.queryParam_Parse(getBoardQuery_salt, [req.body.boardIdx]);
        const getBoardQuery_pw = 'SELECT boardPw FROM board WHERE boardIdx = ?';
        const getBoardResult_pw = await db.queryParam_Parse(getBoardQuery_pw, [req.body.boardIdx]);
        const hashedPwd_= await crypto.pbkdf2((req.body.boardPw).toString(), getBoardResult_salt[0]['salt'], 1000, 32, 'SHA512');
        const hashedPwd_final = hashedPwd_.toString('base64');
        if(hashedPwd_final == getBoardResult_pw[0]['boardPw']){//비번 일치
            const deleteBoardQuery = 'DELETE FROM board WHERE boardIdx= ?';
            const deleteBoardResult = await db.queryParam_Parse(deleteBoardQuery, [req.body.boardIdx]);
            if (deleteBoardResult == 0) {//쿼리문 실패(게시물 삭제 실패)
                res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.BOARD_DELETE_FAIL));
            } else { //쿼리문이 성공했을 때(게시물 삭제 성공)
                res.status(200).send(util.successTrue(statusCode.OK, resMessage.BOARD_DELETE_SUCCESS));
            }
        } else{//비번 불일치
            res.status(200).send(util.successFalse(statusCode.DB_ERROR, resMessage.BOARD_DELETE_FAIL));
        }
    }
});

module.exports = router;
