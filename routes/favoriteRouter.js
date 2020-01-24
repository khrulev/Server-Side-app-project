const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorite');
const favoriteRouter = express.Router();
const cors = require('./cors');
var authenticate = require('../authenticate');
favoriteRouter.use(bodyParser.json());

function UpdateFavorites(favorite, req, res, next, dishId) {

    favorite.author = req.user._id;
    if (dishId == null) {
        req.body.map(favoriteDish => {
            var found = false;
            favorite.dishes.find(item => {
                if (item._id == favoriteDish._id) { found = true };
            });
            if (!found) { favorite.dishes.push(favoriteDish) }
        });
    } else {
        var found = false;
        favorite.dishes.find(item => {
            if (item._id == dishId) { found = true };
        });
        if (!found) { favorite.dishes.push(dishId) }
    }

    favorite.save()
        .then((favorite) => {
            Favorites.findById(favorite._id)
                .populate('dishes.dish')
                .populate('author')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, (err) => next(err))
        }, (err) => next(err))
        .catch((err) => next(err));
}

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Favorites.findOne({ author: req.user._id })
            .populate('dish')
            .populate('author')
            .then((Favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(Favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ author: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    UpdateFavorites(favorite, req, res, next, null);
                }
                else {
                    Favorites.create(req.body)
                        .then((favorite) => {
                            UpdateFavorites(favorite, req, res, null);
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /Favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Favorites.findOne({ author: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    favorite.remove()
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err));
                }
                else {
                    err = new Error('Favorite dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/' + req.params.dishId);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ author: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    UpdateFavorites(favorite, req, res, next, req.params.dishId);
                }
                else {
                    Favorites.create(req.body)
                        .then((favorite) => {
                            UpdateFavorites(favorite, req, res, next, req.params.dishId);
                        }, (err) => next(err));
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Favorites.findOne({ author: req.user._id })
            .then((favorite) => {
                if (favorite != null) {
                    for (var i = (favorite.dishes.length - 1); i >= 0; i--) {
                        if (favorite.dishes[i]._id == req.params.dishId) {
                            favorite.dishes.id(favorite.dishes[i]._id).remove();
                        }
                    }
                    favorite.save()
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err));
                }
                else {
                    err = new Error('Favorite dish ' + req.params.dishId + ' not found');
                    err.status = 404;
                    return next(err);
                }
            }, (err) => next(err))
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;