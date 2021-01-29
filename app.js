// Requiring the necessary libraries
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

// Defining the data for the title
const today = new Date().toLocaleDateString("en-US");

// Another basic settings
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-anna:qwerty2020@cluster0.m6egg.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

// Creating schema for home list items
const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema);

// Creating default items for the home list
const item1 = new Item({
    name: "Welcome to your to-do list!"
});
const item2 = new Item({
    name: "Click the button to add a new item"
});
const item3 = new Item({
    name: "Hit the checkbox to delete an item"
});
const defaultItems = [item1, item2, item3];

// Creating schema
const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

// Getting access to our server
app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved everything!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: today, newListItems: foundItems });
        }
    });
});

// Getting access to subpages with lists
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        }
    });
});

// Adding new items to existing lists
app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === today) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

// Deleting items from existing lists
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;

    const listName = req.body.listName;

    if (listName === today) {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item!");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } },
            function(err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
    }
});
app.listen(3000, function() {
    console.log("Server is running on port 3000");
});