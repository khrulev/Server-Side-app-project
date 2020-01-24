const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var dishesSchema = new Schema({ 
    dish: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish'
    }
});

var favoriteSchema = new Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dishes:[dishesSchema]
}, {
    timestamps: true
});

var Favorites = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorites;