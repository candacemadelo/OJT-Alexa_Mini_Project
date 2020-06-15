const mongoose = require('mongoose');

var OAuthAccessTokenModel = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'OAuthClient' },
    accessToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
    scope: { type: String }
});

module.exports = mongoose.model("oauth_access_token", OAuthAccessTokenModel);