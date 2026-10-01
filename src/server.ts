import app from "./app";
import "./workers/expiration.worker";
import "./workers/email.worker";


const PORT =process.env.PORT|| 5000;


app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
})


