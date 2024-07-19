// Mongoose connection
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/First_project')

require('dotenv').config();


const express = require('express')
const app = express()
const path = require('path')
const session = require('express-session')
const nocache = require('nocache')

app.use(session({
  resave:false,
  saveUninitialized:true,
  secret:process.env.SESSION_SECRET
}))

app.use(nocache())

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '/public')))

app.set('view engine', 'ejs')
app.set('views', './view/user')


const userRoute = require('./routes/userRoute')

app.use('/', userRoute)

const adminRoute = require('./routes/adminRoute')

app.use('/admin', adminRoute)



const errorHandlingMiddleware = require('./middleware/errorHandling')
app.use(errorHandlingMiddleware)

app.all('*',(req,res)=>{
  res.render('404error',{message:undefined})
})


app.listen(3000, () => {
  console.log('server running on http://localhost:3000')
})
