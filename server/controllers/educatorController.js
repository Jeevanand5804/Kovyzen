import { clerkClient } from "@clerk/express";

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