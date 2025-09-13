import axios from "axios";

const baseURL = "http://10.0.0.109:3000/service/";

export const getBusinessServices = async (serialNumber) => {
  try {
    const response = await axios.get(baseURL + "getServices/" + serialNumber);
    return response.data;
  } catch (error) {
    console.error("Error fetching category:", error);
    return [];
  }
};