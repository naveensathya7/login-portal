const express = require('express');
const mysql = require('mysql');
const bodyParser=require('body-parser')
const app = express();
const cors=require('cors');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const axios=require('axios');

dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json())
const JWT_SECRET=process.env.JWT_SECRET;
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;

const corsOptions = {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
  };
  
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));
// Create a MySQL connection
const connection = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'Xtreme@160r',
    port:3306,
    database: 'user' // Use the name of the database you created
});



// Connect to the MySQL database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
  }
    console.log('Connected to the database ');
});
//API TO CREATE NEW PASSWORD
app.post('/reset-password',(req,res)=>{
    const{username,password}=req.body

    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql=`UPDATE user_details SET password='${hashedPassword}' where username='${username}'`
    connection.query(sql,(err)=>{
        if (err){
            return res.status(500).json({message:'Database error'})
        }
        res.status(200).json({message:'Password changed successfully, Please login'})

    })
    
})


const ZEPTOMAIL_API_URL = 'https://api.zeptomail.in/v1.1/email';
const ZEPTOMAIL_API_KEY = 'Zoho-enczapikey PHtE6r0EFLjr3jMsp0QAt/+wE8TyN40tr+hmKFMVsIgUXqMFTk0Bqdl6wDPiqU8jXPJHR/ObzN5ttLOe5+ONdGrtZG1NXmqyqK3sx/VYSPOZsbq6x00etFUdcE3aUIbvetFq0ifQvdbcNA==';

app.post('/send-email', async (req, res) => {
    const{email,otp}=req.body
    console.log(email,otp)
    console.log("email sending")
    const emailBody={"from": { "address": "support@qtnext.com",  "name": "Support"},
            "to": [{"email_address": {"address": `${email}`}}],
            "subject":"Account Confirmation",
            "htmlbody":`<div><b> You otp for email verification is ${otp}</b></div>`}
  try {
    const response = await axios.post(ZEPTOMAIL_API_URL, emailBody, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': ZEPTOMAIL_API_KEY
      }
    });
    console.log("Email sent")
    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).send(error.message);
  }
});

//API TO RETRIEVE USERNAME AND PASSWORDS
app.get('/check-users',()=>{
    const sql='select username,password from user_details'
    connection.query(sql,(err,result)=>{
        if(err){
            return res.status(500).json({message:'Database error'})
        }
        if (result.length===0){
            return res.status(400).json({message:'No users found'})
        }
        console.log(typeof result,result)
        
    })
})
//API TO VALIDATE USER DETAILS FOR PASSWORD RESET
app.post('/forgot-password',(req,res)=>{
    const{username,email,mobileNumber}=req.body;
    console.log(username,mobileNumber,email)
    const sql = `SELECT * FROM user_details WHERE username = '${username}' and mobile_number='${mobileNumber}' and email='${email}'`;
    connection.query(sql, (err, result) => {
        console.log(result)
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }
        res.status(200).json({message:"User found, Create new password"});
})

})

//API FOR USER LOGIN
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check if the user exists
    const sql = `SELECT * FROM user_details WHERE username = '${username}'`;
    connection.query(sql, (err, result) => {
        
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(400).json({ error: 'User not found' });
        }

        const user = result[0];
        
        // Compare the password
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login successful', token });
    });
});

//API FOR USER SIGNUP
app.post('/signup', (req,res)=>{
    const{username,email,password,mobileNumber}=req.body;
    console.log(username)
    const sql=`SELECT * FROM user_details where username='${username}';`

    connection.query('SELECT * FROM user_details where username=?',[username],(err,result)=>{
        console.log(result)
       /* if (err){
            return res.status(500).json({"message":"Database error"})
        }*/
        if (result.length>0){
            return res.status(400).json({message:"User already exists"})
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        console.log("Hello")
        const signupQuery=`INSERT INTO user_details (username,email,password,mobile_number)VALUES('${username}','${email}','${hashedPassword}','${mobileNumber}')`
        connection.query(signupQuery,(err,result)=>{
            console.log(err)
            if (err){
                return res.status(500).json({"message":"Database error"})
            }
            res.status(200).json({ message: 'User created successfully' });
        })
    })

})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${8000} `);
});

