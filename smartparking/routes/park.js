var express = require('express');
var bodyParsers = require('body-parser');
var router = express.Router();
//---------------------------------------------------------------------------------------------------------
router.use(bodyParsers.json());
router.use(bodyParsers.urlencoded({extended: true}));
//-----------------------------------------------------------------------------------------------------------

const DATABASE = require('../modules/database');
const OPENAL = require('../modules/openalpr');
const FIRE = require('../modules/firebasedatabase');
const FIREADMIN = require('../modules/firebaseAdmin');
var fire = FIRE();
var database = DATABASE();
var openalr = OPENAL();
var fireadmin = FIREADMIN();


router.post("/info", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    fire.getParkInfo(req.body.id, function (park) {

        res.send({code: 1, mes: "Success", data: {park}});

    }, function () {
        res.send({code: 0, mes: "Fail to login!", data: {}});

    })


});


router.post("/register", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    fire.writeParkDataInfo(req.body);


});


router.post("/sign", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);//id,phone,start_at
    fire.getUrlImg(req.body.id_park, function (url) {

        if (url == null) {
            res.send({code: 0, mes: "Sorry, try again!", data: {}});
        } else

            database.createTicket(req.body, url, function (ticket) {
                res.send({code: 1, mes: "Success", data: {ticket}});
            }, function (err) {
                res.send({code: 0, mes: "Fail", data: {err}});
            })

    }, function (err) {
        res.send({code: 0, mes: "Fail", data: {err}});
    });


});

router.post("/license-plate", function (req, res, next) {

    if (!req.body) return res.sendStatus(400);
    console.log(req.body);//id,phone,start_at

    openalr.callImg(req.body.data,
        function (data) {
            fire.upUrlImg(req.body.id_park, data);
            res.send({code: 1, mes: "Success", data: {data}});
        }, function (err) {

            res.send({code: 0, mes: "Fail", data: {err}});

        });


});
router.post("/out", function (req, res, next) {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    openalr.callImg(req.body.data,
        function (data) {
            console.log(data);
            if (data == req.body.plate) {
                console.log(1);
                database.updateTicket(req.body, function (data) {

                    console.log(2);

                    database.unrecharge(req.body.id_user, req.body.price, function (data) {
                        console.log(data);
                        database.finduserbyphone(req.body.id_user, function (data) {

                            fireadmin.sendmes(data.firebase_token, "Bạn vừa hoàn thành gửi xe " + req.body.plate + " , chi phi: " + req.body.price+"đ","SmartParking !",function (data) {

                            },function (err) {

                            });
                            res.send({code: 1, mes: "Success", data: {data}});
                        }, function (err) {
                            res.send({code: 0, mes: "Fail", data: {err}});
                        })


                    }, function (err) {
                        console.log(4);
                        res.send({code: 0, mes: "Fail", data: {err}});
                    });


                }, function (err) {
                    console.log(5);
                    res.send({code: 0, mes: "Fail", data: {err}});
                });

            }
            else {
                database.finduserbyphone(req.body.id_user, function (data) {

                    fireadmin.sendmes(data.firebase_token, "Biển số xe ghi nhận " + data + " không đúng với  thông tin vé", "Cảnh báo", function (data) {

                    }, function (err) {

                    })


                }, function (err) {

                })

                res.send({code: 0, mes: "Biển số xe ghi nhận " + data + " không đúng với  thông tin vé", data: {}});

            }

        }, function (err) {

            res.send({code: 0, mes: "Fail", data: {err}});

        });


});

module.exports = router;
