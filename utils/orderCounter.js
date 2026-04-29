const Counter = require("../model/counterModal");

const generateOrderNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "order" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    return counter.seq;
};

module.exports = generateOrderNumber;