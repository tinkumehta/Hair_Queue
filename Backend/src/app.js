import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors ({
    origin : process.env.CORS_ORIGIN || 'http://localhost:5173/login',
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes
import userRouter from './routes/user.routes.js'
import shopRouter from './routes/shop.routes.js'
import queueRouter from './routes/queue.routes.js'


app.get("/", (req, res) => res.send("Tinku kumar"));
app.use("/api/v1/users", userRouter)
app.use("/api/v1/shop", shopRouter)
app.use("/api/v1/queue", queueRouter)

// http://localhost:5000/api/v1

export {
    app
}