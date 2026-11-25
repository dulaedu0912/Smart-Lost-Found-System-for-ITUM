import { ImageSourcePropType } from "react-native";

const categoryImages: Record<string, ImageSourcePropType> = {
  "Student ID card": require("../assets/report-images/student-id-card.jpg"),
  "Scientific calculator": require("../assets/report-images/scientific-calculator.jpg"),
  "Water bottle": require("../assets/report-images/water-bottle.jpg"),
  Earphones: require("../assets/report-images/earphones.jpg"),
  Umbrella: require("../assets/report-images/umbrella.jpg"),
  "USB drive": require("../assets/report-images/usb-drive.jpg"),
  Spectacles: require("../assets/report-images/spectacles.jpg"),
};

export function getReportImageSource(
  photoUrl: string | undefined,
  category: string,
): ImageSourcePropType | undefined {
  if (photoUrl) return { uri: photoUrl };
  return categoryImages[category];
}
