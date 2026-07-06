import { Webhook } from "svix";
import User from "../models/user.js";
import Stripe from "stripe";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
    const { type, data } = req.body;
    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.create(userData);
        res.status(200).json({ message: "User created successfully" });
        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.status(200).json({ message: "User updated successfully" });
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.status(200).json({ message: "User deleted successfully" });
        break;
      }

      default: {
        res.status(200).json({ message: "Event type not handled" });
        break;
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Internal server error" });
  }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':{
        const paymentIntent = event.data.object;
        const paymentIntentId=paymentIntent.id;

        const session=await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
        })
        const {purchaseId}=session.data[0].metadata;
        const purchaseData=await Purchase.findById(purchaseId);
        const userData=await User.findById(purchaseData.userId);
        const courseData=await Course.findById(purchaseData.courseId.toString());
        courseData.enrolledStudents.push(userData);
        await courseData.save();
        await userData.save();
        purchaseData.status='completed';
        await purchaseData.save();
        break;
    }

    case 'payment_intent.payment_failed':{
         const paymentIntent = event.data.object;
        const paymentIntentId=paymentIntent.id;

        const session=await stripeInstance.checkout.sessions.list({
            payment_intent:paymentIntentId,
        })
        const {purchaseId}=session.data[0].metadata;
        const purchaseData=await Purchase.findById(purchaseId);
        purchaseData.status='failed';
        await purchaseData.save();
        break;
    }
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
