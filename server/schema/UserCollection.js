const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
  },
  {
    collection: "Users",
    timestamps: true,
  }
);
module.exports = {
  UserCollection: mongoose.model("Users", UserSchema, "Users"),
};
