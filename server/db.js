import env from "dotenv";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const UserDataSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  conversations: { type: Map, required: true, of: String },
});

const UserDataModel = mongoose.model("users", UserDataSchema);

env.config();

const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri)
  .then((res) => console.log("Connected"))
  .catch((err) => console.log("An error has occured", err));

export const addUser = async (newEmail, newUsername) => {
  const userExists = await UserDataModel.exists({ email: newEmail });
  if (userExists) {
    console.log("User already in database!");
    return false;
  } else {
    const newUserData = new UserDataModel({
      email: newEmail,
      username: newUsername,
      conversations: {},
    });
    newUserData
      .save()
      .then(() => console.log("Success!"))
      .catch((err) => console.log(err));
    return true;
  }
};

export const getUserByEmail = async (data) => {
  const dataFound = await UserDataModel.find({ email: data });
  if (dataFound) {
    return dataFound;
  } else {
    console.log("User does not exist");
  }
};

export const getUserConversations = async (clientEmail) => {
  const user = await getUserByEmail(clientEmail);

  if (user) {
    if (user[0]) {
      return user[0]["conversations"];
    }
  }
};

export const saveConversation = async (msgName, msg, email) => {
  if (msg && msgName) {
    const user = await getUserByEmail(email);
    var convoData = user[0]["conversations"];
    convoData.set(msgName, msg);
    if (user) {
      const saveMsg = await UserDataModel.updateOne(
        { email: email },
        { $set: { conversations: convoData } }
      );
      if (saveMsg) {
        return true;
      } else {
        return false;
      }
    }
  }
};
