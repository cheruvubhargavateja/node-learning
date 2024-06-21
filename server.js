const fs = require("fs");
const path = require("path");

function readFileToArray(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }
      // Split the data by new lines
      const lines = data.split("\n").map((line) => {
        const [date, sku, unitPrice, quantity, totalPrice] = line
          .split(",")
          .map((item) => item.trim());
        return {
          date,
          sku,
          unitPrice: parseFloat(unitPrice),
          quantity: parseInt(quantity),
          totalPrice: parseFloat(totalPrice),
        };
      });
      resolve(lines);
    });
  });
}

// Example usage
const filePath = path.join(__dirname, "data.txt");


readFileToArray(filePath)
  .then((lines) => {
    console.log(calculateResults(lines));
  })
  .catch((err) => {
    console.error("Error reading the file:", err);
  });

// Function to calculate required results
function calculateResults(data) {
  const results = {
    totalSales: 0,
    monthWiseSales: {},
    mostPopularItems: {},
    highestRevenueItems: {},
    popularItemStats: {},
  };

  const monthWiseData = {};

  data.forEach((item) => {
    const month = item.date.slice(0, 7); // Extracting YYYY-MM

    // Total sales
    results.totalSales += item.totalPrice;

    // Month wise sales
    if (!results.monthWiseSales[month]) {
      results.monthWiseSales[month] = 0;
    }
    results.monthWiseSales[month] += item.totalPrice;

    // Organize data by month for further calculations
    if (!monthWiseData[month]) {
      monthWiseData[month] = [];
    }
    monthWiseData[month].push(item);
  });

  for (const month in monthWiseData) {
    const items = monthWiseData[month];

    // Most popular item in each month
    const popularItem = items.reduce((acc, item) => {
      if (!acc[item.sku]) {
        acc[item.sku] = 0;
      }
      acc[item.sku] += item.quantity;
      return acc;
    }, {});
    const mostPopular = Object.keys(popularItem).reduce((a, b) =>
      popularItem[a] > popularItem[b] ? a : b
    );
    results.mostPopularItems[month] = mostPopular;

    // Item generating most revenue in each month
    const revenueItem = items.reduce((acc, item) => {
      if (!acc[item.sku]) {
        acc[item.sku] = 0;
      }
      acc[item.sku] += item.totalPrice;
      return acc;
    }, {});
    const highestRevenue = Object.keys(revenueItem).reduce((a, b) =>
      revenueItem[a] > revenueItem[b] ? a : b
    );
    results.highestRevenueItems[month] = highestRevenue;

    // Min, max, and average number of orders for the most popular item
    const popularItemOrders = items
      .filter((item) => item.sku === mostPopular)
      .map((item) => item.quantity);
    const minOrders = Math.min(...popularItemOrders);
    const maxOrders = Math.max(...popularItemOrders);
    const avgOrders =
      popularItemOrders.reduce((sum, qty) => sum + qty, 0) /
      popularItemOrders.length;
    results.popularItemStats[month] = { minOrders, maxOrders, avgOrders };
  }

  return results;
}
