import React, { useEffect } from "react";
import { Button } from "./ui/button";
import { useCreateCheckoutSessionMutation } from "@/features/api/purchaseApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";


import axios from "axios";
import { useState } from "react";

const BuyCourseButton = ({ courseId }) => {
  const BASE_URL = "http://localhost:8080/api/v1/purchase";
  const [loading, setLoading] = useState(false);

  const purchaseCourseHandler = async () => {
    setLoading(true);
    try {
      // 1. Create Razorpay order from backend
      const res = await axios.post(
        `${BASE_URL}/razorpay/create`,
        { courseId },
        { withCredentials: true }
      );

      const { order, keyId } = res.data;
      const orderId = res.data.orderId;
      const { amount, notes } = order;

      console.log("Response is :",res);
      console.log("order is :",order);
      console.log("keyId is :",keyId);
      console.log("amount is :",amount);
      console.log("orderId is :",orderId);
      console.log("notes is :",notes);


      const options = {
        key: keyId,
        amount,
        currency: "INR",
        name: "DevTinder Courses",
        description: `Course Purchase - ${notes?.courseName}`,
        image: "https://example.com/logo.png",
        order_id: orderId,
        prefill: {
          name: notes?.fullName,
          email: notes?.email,
          contact: notes?.contact || "9000090000",
        },
        notes: {
          courseId: courseId,
        },
        theme: {
          color: "#6366f1", // indigo
        },
        handler: async function (response) {
          try {
            console.log("Response is :",response);
            // 2. Verify the payment on backend
            const verifyRes = await axios.post(
              `${BASE_URL}/razorpay/verify`,
              {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            console.log("verified response is :",verifyRes);

            if (verifyRes?.data?.paymentVerified) {
              toast.success("Course purchased successfully!");
              // Optional: Redirect to course page
              // window.location.href = "/my-courses";
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (error) {
            console.log("Error during verification:", error);
            toast.error("Something went wrong during verification.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={purchaseCourseHandler}
      disabled={loading}
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        "Purchase Course"
      )}
    </Button>
  );
};

const BuyCourseButton1 = ({ courseId }) => {
  const [createCheckoutSession, {data, isLoading, isSuccess, isError, error }] =
    useCreateCheckoutSessionMutation();

  const purchaseCourseHandler = async () => {
    await createCheckoutSession(courseId);
  };

  useEffect(()=>{
    if(isSuccess){
       if(data?.url){
        window.location.href = data.url; // Redirect to stripe checkout url
       }else{
        toast.error("Invalid response from server.")
       }
    } 
    if(isError){
      toast.error(error?.data?.message || "Failed to create checkout session")
    }
  },[data, isSuccess, isError, error])

  return (
    <Button
      disabled={isLoading}
      onClick={purchaseCourseHandler}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        "Purchase Course"
      )}
    </Button>
  );
};

export default BuyCourseButton;
