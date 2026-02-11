const { z } = require("zod");

const addressSchema = z.object({
  userName: z
    .string({ required_error: "Name is required." })
    .regex(/^[A-Za-z\s]{3,}$/, "Name must contain only letters and be at least 3 characters."),

  userLocality: z
    .string({ required_error: "Locality is required." })
    .regex(/^[A-Za-z0-9\s,.-]{3,}$/, "Enter a valid locality."),

  userAltPhone: z
    .string({ required_error: "Phone number is required." })
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number."),

  userAddress: z
    .string({ required_error: "Address is required." })
    .regex(/^[A-Za-z0-9\s,./-]{5,}$/, "Enter a valid address (min 5 characters)."),

  userLandmark: z
    .string({ required_error: "Landmark is required." })
    .regex(/^[A-Za-z0-9\s,.-]{3,}$/, "Enter a valid landmark."),

  userCity: z
    .string({ required_error: "City is required." })
    .regex(/^[A-Za-z\s]{2,}$/, "Enter a valid city."),

  userState: z
    .string({ required_error: "State is required." })
    .regex(/^[A-Za-z\s]{2,}$/, "Enter a valid state."),

  userPIN: z
    .string({ required_error: "PIN code is required." })
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),

  addressType: z.enum(["Home", "Work"], {
    errorMap: () => ({ message: "Please select an address type." })
  })
});

module.exports =  addressSchema 
