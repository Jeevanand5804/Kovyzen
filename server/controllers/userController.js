import User from "../models/user.js";
import Purchase from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";

export const getUserData=async (req,res)=>{
    try{
        const userId=req.auth.userId;
        const user=await User.findById(userId);
        if(!user){
            return res.json({success:false,message:"User not found"})
        }
        res.json({success:true,user})
    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message})
    }
}

// Users Enrolled Courses Withh Lacture Links

export const userEnrolledCourses=async(req,res)=>{
    try{
        const userId=req.auth.userId
        const UserData=await User.findById(userId).populate('enrolledCourses');
        res.json({success:true, enrolledCourses: UserData.enrolledCourses})
    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message})
    }
}

// Purchase Course
export const purchaseCourse = async (req, res) => {
    try{
        const {courseId} = req.body;
        const {origin}=req.headers
        const userId=req.auth.userId;
        const userData=await User.findById(userId)
        const courseData=await Course.findById(courseId)
        if(!userData || !courseData){
            return res.json({success:false,message:"User or Course not found"})
        }
        const purchaseData={
            courseId:courseData._id,
            userId,
            amount:(courseData.coursePrice-courseData.discount*courseData.coursePrice/100).toFixed(2)
        }
        const newPurchase=await Purchase.create(purchaseData)

        // Stripe Payment Intent
        const stripeInstance=new Stripe(process.env.Stripe_SECRET_KEY)
        const currency=process.env.CURRENCY.toLowerCase() || 'USD'
        
        // Creating line items to for Stripe
        const line_items=[{
            price_data:{
                currency,
                product_data:{
                    name:courseData.courseTitle,
                },
                unit_amount:Math.floor(newPurchase.amount)*100
            },
            quantity:1
        }]
        const session = await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/loading/my-enrollments`,
            cancel_url:`${origin}`,
            line_items:line_items,
            mode:'payment',
            metadata:{
                purchaseId:newPurchase._id.toString()
            }
        })
        res.json({success:true,session_url:session.url})

    }catch(err){
        res.json({success:false,message:err.message})
    }
}


