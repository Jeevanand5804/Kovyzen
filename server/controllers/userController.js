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

// Update User Course Progress

export const updateCourseProgress=async(req,res)=>{
    try{
        const userId=req.auth.userId;
        const {courseId,lectureId}=req.body;
        const progressData=await CourseProgress.findOne({userId,courseId})
        if(!progressData){
            if(progressData.lectureCompleted.includes(lectureId)){
            return res.json({success:ture,message:"lecture already completed"})
            }
            progressData.lectureCompleted.push(lectureId)
            await progressData.save();
        }else{
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted:[lectureId]
            })
        }
        return res.json({success:true,message:"Course Progress Updated"})
    }catch(err){
        return res.json({success:false,message:err.message})
    }
}

// Get User Course Progress

export const getUserCourseProgress=async(req,res)=>{
    try {
        const userId=req.auth.userId;
        const {courseId}=req.params;
        const progressData=await CourseProgress.findOne({userId,courseId})
        return res.json({success:true,progress:progressData})
    } catch (err) {
        return res.json({success:false,message:err.message})
    }
}

// Add User Rating to Course

export const addUserRating=async(req,res)=>{
    const userId=req.auth.userId;
    const {courseId,rating}=req.body;
    if(!courseId || !rating||!userId||rating<1||rating>5){
        return res.json({success:false,message:"Invalid course ID or rating"})
    }
    try{
        const course=await Course.findById(courseId);
        if(!course){
            return res.json({success:false,message:"Course not found"})
        }
        const user=await User.findById(userId);
        if(!user||!user.enrolledCourses.includes(courseId)){
            return res.json({success:false,message:"User not purchased this course"})
        }
        const existingRatingIndex=course.CourseRatings.findIndex(r=>r.userId===userId);
        if(existingRatingIndex>-1){
            course.CourseRatings[existingRatingIndex].rating=rating;
        }else{
            course.CourseRatings.push({userId,rating});
        }
        await course.save();
        return res.json({success:true,message:"Rating added successfully"})
    }catch(err){
        return res.json({success:false,message:err.message})
    }
}
