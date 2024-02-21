const mongoose = require("mongoose");
const ImageTagSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
    assigned: {
      type: Boolean,
      required: false,
    },

    assignedTo: {
      type: String,
      required: false,
    },
  }
);
module.exports = {
  ImageTagCollection: mongoose.model("Images", ImageTagSchema, "Images"),
};
