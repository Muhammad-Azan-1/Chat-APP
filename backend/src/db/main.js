import mongoose from 'mongoose'



export default async function dbConnect(){

   try{
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`)
    console.log(`Connection established on host : ${connectionInstance.connection.host}`)
   }catch(error){
    console.log("Error connecting to database",error)
    process.exit(1)
   }
}
