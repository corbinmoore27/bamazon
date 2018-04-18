require("dotenv").config();

var mysql = require("mysql");
var inquirer = require("inquirer");
var key = require("./key");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: key.access.password,
  database: "bamazonDB"
});

connection.connect(function(err) {
  if (err) throw err;
  // console.log("connected as id " + connection.threadId);
  start();
});

function start() {
  inquirer.prompt({
      name: "starter",
      type: "list",
      message: "Would you like to see the list of product?",
      choices: ["YES", "NO"]
    })
    .then(function(answer) {
      if (answer.starter.toUpperCase() === "YES") {
        viewProduct();
      }
      else {
        connection.end();
      }
    });
}

function viewProduct() {
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;
    console.log("These are the items for sale:");
    for (let i = 0; i < res.length; i++) {
      console.log(res[i].item_id + " | " + res[i].product_name + " | " + parseFloat(res[i].price)); 
    }
    whichId();
  });
}

function whichId() {
  connection.query("SELECT * FROM products", function(err, res) {
    
    if (err) throw err;
    inquirer.prompt([
        {
          name: "productBuy",
          type: "list",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < res.length; i++) {
              choiceArray.push("" + res[i].item_id);
            }
            return choiceArray;
          },
          message: "Which product id would you like to buy?"
        },
        {
          name: "quantity",
          type: "input",
          message: "How many would you like to buy?"
        }
      ])
      .then(function(answer) {
        var stockchoice;
        for (var i = 0; i < res.length; i++) {
          if (res[i].item_id === parseInt(answer.productBuy)) {
            stockchoice = res[i];
          }
        };

        if (stockchoice.stock_quantity >= parseInt(answer.quantity)) {
          connection.query(
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: (stockchoice.stock_quantity - answer.quantity)
              },
              {
                item_id: stockchoice.item_id
              }
            ],
            function(error) {
              if (error) throw err;
              console.log("Your order was placed!");
              console.log("Total price: $" + parseFloat(answer.quantity * stockchoice.price).toFixed(2));
              
              start();
            }
          );
        }
        else {
          console.log("Insufficient quantity!");
          whichId();
        }
      });
  });
}