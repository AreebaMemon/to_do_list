const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const bodyParser = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const url = mongoose.connect("mongodb+srv://admin-areeba:test123@cluster0.njfhizj.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0");

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todo list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems).then(() => {
          console.log("Default items inserted");
          res.redirect("/");
        });
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems,
        });
      }
    })
    .catch((err) => {
      console.error(" Error fetching items:", err);
    });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        console.log("List not found, creating new list:", customListName);
        const list = new List({
          name: customListName,
          items: defaultItems, // Initialize with default items
        });

        list.save();
        res.redirect(`/${customListName}`); // Redirect to the new list
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.error("Error finding list:", err);
    });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      if (foundList) {
        foundList.items.push(item);
        foundList.save().then(() => {
          res.redirect("/" + listName);
        });
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        console.log("Deleted item:", checkedItemId);
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error deleting item:", err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        console.log("Deleted item from list:", listName);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error("Error deleting item from custom list:", err);
      });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.post("/work", (req, res) => {
  let item = req.body.newItem;
});

app.listen(3000, () => {
  console.log("Server is Listen on port 3000");
});
