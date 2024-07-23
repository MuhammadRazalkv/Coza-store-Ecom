// Mongoose connection
require('dotenv').config();
const mongoose = require('mongoose')
// mongoose.connect('mongodb://127.0.0.1:27017/First_project')
mongoose.connect(process.env.MONGO_CONNECT)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));


console.log('e',process.env.MONGO_CONNECT);

const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')

const nocache = require('nocache')

app.use(nocache())


app.use(session({
  resave:false,
  saveUninitialized:true,
  secret:process.env.SESSION_SECRET
}))



// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '/public')))

app.set('view engine', 'ejs')
app.set('views', './view/user')


const userRoute = require('./routes/userRoute')

app.use('/', userRoute)

const adminRoute = require('./routes/adminRoute')

app.use('/admin', adminRoute)





app.all('*',(req,res)=>{
  res.render('404error',{message:undefined})
})


app.listen(3000, () => {
  console.log('server running on http://localhost:3000')
})
