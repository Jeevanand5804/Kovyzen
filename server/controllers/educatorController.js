import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary';
import Course from "../models/Course.js";

export const updateRoleToEducator = async (req,res)=>{
    try{
        const userId=req.auth.userId;
        await clerkClient.users.updateUserMetadata(userId,{
            publicMetadata:{
                role:'educator',
            }
        });
        return res.status(200).json({success:true,message:"Role updated to educator"});
    }catch(err){
        console.log(err);
        return res.status(500).json({success:false,message:"Internal server error"});
    }
}

// Add new Course
export const addCourse=async(req,res)=>{
    try{
        const{courseData}=req.body;
        const imageFile=req.file;
        const educatorId=req.auth.userId;
        if(!imageFile){
            return res.json({success:false,message:'Thumnail Not Attached'})
        }
        const parsedCourseData=await JSON.parse(courseData);
        parsedCourseData.educator=educatorId;
        await Course.create(parsedCourseData);
        const newCourse=await Course.create(parsedCourseData);
        const imageUpload=await cloudinary.uploader.upload(imageFile.path)
        newCourse.courseThumnail=imageUpload.secure_url;
        await newCourse.save();
        res.json({success:true,message:'Course Added'})
    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message})
    }
}

export const getEducatorCourses=async(req,res)=>{
    try{
        const educator=req.auth.userId
        const courses=await Course.find({educator})
        res.json({success:true,courses})
    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message})
    }
}

//Get Educator Dashboard Data (Total Earning,Enrolled Students, No. of Courses)
export const educatorDashboardData=async(req,res)=>{
    try{
        const educator=req.auth.userId;
        const courses=await Course.find({educator});
        const totalCourses=courses.length;
        const courseIds=courses.map(course=>course._id);
        const purchases=await Purchase.find({courseId:{$in:courseIds},status:'success'});
        const totalEarning=purchases.reduce((sum,purchase)=>sum+purchase.amount,0);
        const enrolledStudentsData=[]
        for(const course of courses){
            const students=await User.find({
                _id:{$in:course.enrolledStudents}
            },'name imageUrl');
            students.forEach(student=>{
                enrolledStudentsData.push({
                    courseTitle:course.courseTitle,
                    student
                })
            })
        }
        res.json({success:true,dashboardData:{totalCourses,totalEarning,enrolledStudentsData}})
    }catch(err){
        res.json({success:false,message:err.message})
    }
}

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData=async(req,res)=>{
    try{
        const educator=req.auth.userId;
        const courses=await Course.find({educator});
        const courseIds=courses.map(course=>course._id);
        const purchases=await Purchase.find({courseId:{$in:courseIds},status:'success'}).populate('userId','name imageUrl').populate('courseId','courseTitle');
        const enrolledStudents=purchases.map(purchase=>({
            student:purchase.userId,
            courseTitle:purchase.courseId.courseTitle,
            purchaseData:purchase.createdAt
        }))
        res.json({success:true,enrolledStudentsData:enrolledStudents})
    }catch(err){
        res.json({success:false,message:err.message})
    }
}

