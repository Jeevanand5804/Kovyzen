import Course from "../models/Course.js";


// Get All Courses
export const getAllCourses = async (req, res) => {
    try{
        const courses = await Course.find({isPublished:true}).select(['-courseContent','-enrolledStudents']).populate({path:'educator'});
        res.json({success:true,courses})
    }catch(err){
        res.json({success:false,message:err.message})
    }
}

//Get Course By ID
export const getCourseById = async (req, res) => {
    const {courseId} = req.params;
    try{
        const courseData = await Course.findById(courseId).populate({path:'educator'});
        courseData.courseContent.forEach(chapter=>{
            chapter.chapterContent.forEach(lecture=>{
                if(!lecture.isPreviewFree){
                    lecture.lectureUrl="";
                }
            });
        });
        res.json({success:true,course:courseData })
    }catch(err){
        res.json({success:false,message:err.message})
    }
}


