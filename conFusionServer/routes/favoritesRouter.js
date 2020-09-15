const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req,res,next) => {
    Favorites.find({ user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id}).then((favorites) => { 
        if (favorites == null) {
            Favorites.create({user: req.user._id, dishes: req.body})
            .then((favorite) => {
                console.log('Favorite Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            var dishes = req.body;
            dishes.forEach(dish => { 
                if (favorites.dishes.indexOf(dish) == -1) {
                    favorites.dishes.push(dish);
                }
            });
            
            favorites.save()
                .then((dish) => {
                    Favorites.find({ user: req.user._id})
                    .populate('user')
                    .populate('dishes')
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);  
                    })               
                }, (err) => next(err));
        }
    });
    
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

favoriteRouter.route('/:favoriteId')
.post(authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id}).then((favorites) => { 
        console.log("I`m here");
        if (!favorites) {
            console.log("I`m here2");
            Favorites.create({user: req.user._id, dishes: req.params.favoriteId})
            .then((favorite) => {
                console.log('Favorite Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            console.log("I`m here3");
            var dish = req.params.favoriteId;
            
            if (favorites.dishes.indexOf(dish) == -1) {
                favorites.dishes.push(dish);
            }
            
            favorites.save()
            .then((dish) => {
                Favorites.find({ user: req.user._id})
                .populate('user')
                .populate('dishes')
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);  
                })               
            }, (err) => next(err));
        }
    });
})
.delete(authenticate.verifyUser, (req, res, next) => {
    
    Favorites.findOne({ user: req.user._id})
        .populate('dishes')
        .then((favorites) => { 
        if (favorites != null) {
            for (var i = (favorites.dishes.length - 1); i >= 0; i--) {
                if (favorites.dishes[i]._id == req.params.favoriteId) {
                    favorites.dishes[i].remove();
                    //favorites.dishes.id(favorites.dishes[i]._id).remove();
                }
            }
            favorites.save()
            .then((dish) => {
                Favorites.find({ user: req.user._id})
                .populate('user').populate('dishes')
                .then((favorites) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);  
                })               
            }, (err) => next(err));
        }
        else {
            
        }
    })
    .catch((err) => next(err));
});

module.exports = favoriteRouter;