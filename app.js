const express = require("express");
const app = express();
const _ = require("lodash");

const mongoose = require("mongoose");

mongoose.connect(process.env.CONNECTION_STRING);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({ name: "Welcome to your ToDo App." });

const item2 = new Item({ name: "Hit + button to add a new item." });

const item3 = new Item({ name: "⬅️ Hit this to remove an item." });

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  List.find(function (err, lists) {
    if (err) {
      console.log(err);
    } else {
      if (lists.length === 0) {
        List.insertMany(
          {
            name: "Today",
            items: defaultItems,
          },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log("First item inserted");
            }
          }
        );
        res.redirect("/");
      } else {
        const list = lists[0];
        res.render("main", { lists: lists, showList: list });
      }
    }
  });
});

app.get("/:listName/:listId", function (req, res) {
  const listId = req.params.listId;
  List.find(function (err, lists) {
    if (err) {
      console.log(err);
    } else {
      List.findById(listId, function (err, foundList) {
        if (err) {
          console.log(err);
        } else {
          res.render("main", { lists: lists, showList: foundList });
        }
      });
    }
  });
});

app.post("/add", function (req, res) {
  const listId = req.body.listId;

  List.find(function (err, foundLists) {
    if (err) {
      console.log(err);
    } else {
      if (req.body.newItem != "") {
        const newItem = new Item({
          name: req.body.newItem,
        });

        List.findByIdAndUpdate(
          listId,
          { $push: { items: newItem } },
          function (err) {
            if (err) {
              console.log(err);
            } else {
              List.findById(listId, function (err, foundList) {
                if (err) {
                  console.log(err);
                } else {
                  res.redirect("/" + foundList.name + "/" + foundList._id);
                }
              });
            }
          }
        );
      } else {
        List.findById(listId, function (err, foundList) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/" + foundList.name + "/" + foundList._id);
          }
        });
      }
    }
  });
});

app.post("/remove", function (req, res) {
  const itemId = req.body.itemId;
  const listId = req.body.listId;

  List.find(function (err, foundLists) {
    if (err) {
      console.log(err);
    } else {
      List.findByIdAndUpdate(
        listId,
        {
          $pull: {
            items: { _id: itemId },
          },
        },
        function (err, obj) {
          if (err) {
            console.log(err);
          } else {
            List.findById(listId, function (err, foundList) {
              if (err) {
                console.log(err);
              } else {
                res.redirect("/" + foundList.name + "/" + foundList._id);
              }
            });
          }
        }
      );
    }
  });
});

app.post("/addList", function (req, res) {
  const newListName = _.capitalize(req.body.newListName);

  if (newListName != "") {
    // add new list
    const newList = new List({
      name: newListName,
      items: defaultItems,
    });

    newList.save(function (err, addedList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + newListName + "/" + addedList._id);
      }
    });
  } else {
    const listId = req.body.listId;
    List.findById(listId, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/" + foundList.name + "/" + foundList._id);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const listId = req.body.listId;
  List.findByIdAndDelete(listId, function (err, out) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server has started successfully.");
});
