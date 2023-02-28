const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); //
const db_name = path.join(__dirname, "data", "user_p.db");
const db = new sqlite3.Database(db_name, err => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database 'user_p.db'");
});


const sql_create = `CREATE TABLE IF NOT EXISTS user_p (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL
  );`;

db.run(sql_create, (err, row) => {
    if (err) {
        console.error(err.message)
    }
    console.log("Successful creation of the 'users_p' table")
})

// app.listen(3000, () => {
//     {
//         console.log("Server started (http://localhost:3000/) !");
//     }
// });

//Page Login
app.get("/", (req, res) => {
    {
        // res.send("Hello world...");
        res.render("Login");
    }
});
//Page Register
app.get("/register", (req, res) => {
    {
        res.render("register");
    }
});
//Page Index
app.get("/index", (req, res) => {
    {
        res.render("index");
    }
});


//Create
app.post("/register", (req, res) => {
    const sql = "INSERT INTO user_p (username, password, name) VALUES (?, ?, ?)";
    const data = [req.body.username, req.body.password, req.body.name];
    db.run(sql, data, (err) => {
        // if (err){
        //     console.log("ไม่ผ่าน");
        // }
        res.redirect("/");
    });
});

//login
app.post("/users", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM user_p WHERE username = ?", [username], (err, users) => {
        if (err) {
            console.error(err);
            res.status(500).send("Internal Server Error");
            
            return;
        }

        if (!users || users.password !== password) {
            res.status(401).send("Invalid username or password");
            // window.location.replace("../");
            return;
        }

        res.render("index");
        // res.send(Welcome, ${user.email}!);
    });
});

//show 
app.get("/users", (req, res) => {
    const sql = "SELECT * FROM user_p ORDER BY id"
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("users", { model: rows });
    });
});

// GET /edit/id?
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM user_p WHERE id = ?";
    db.get(sql, id, (err, row) => {
        // if (err) ...
        res.render("edit", { model: row });
    });
});

//post /update/id?
app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const book = [req.body.username, req.body.password, req.body.name, id];
    const sql = "UPDATE user_p SET username = ?, password = ?, name = ? WHERE (id = ?)";
    db.run(sql, book, err => {
        // if (err) ...
        res.redirect("/users");
    });
});

// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
    const sql = "INSERT INTO user_p (username, password, name) VALUES (?, ?, ?)";
    const book = [req.body.username, req.body.password, req.body.name];
    db.run(sql, book, err => {
        // if (err) ...
        res.redirect("/users");
    });
});

// GET /delete/id?
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM user_p WHERE id = ?";
    db.get(sql, id, (err, row) => {
        // if (err) ...
        res.render("delete", { model: row });
    });
});

// POST /delete/id?
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM user_p WHERE id = ?";
    db.run(sql, id, err => {
        // if (err) ...
        res.redirect("/users");
    });
});


const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
    debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId, userName) => {
        socket.join(roomId);
        setTimeout(() => {
            socket.to(roomId).broadcast.emit("user-connected", userId);
        }, 1000)
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});


server.listen(process.env.PORT || 3030);
console.log("Server started (http://localhost:3030/) !");
