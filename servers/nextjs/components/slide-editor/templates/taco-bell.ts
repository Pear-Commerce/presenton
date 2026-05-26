import {
  createComponentTemplatesFromSpec,
  createDeckFromSpec,
  type DeckSpec,
  type DeckSpecElement,
} from "./deck-spec-adapter";

const BG = "FFFFFF";
const INK = "111827";
const MUTED = "4B5563";
const SUBTLE = "6B7280";
const LINE = "E5E7EB";
const SURFACE = "F9FAFB";
const PURPLE = "9333EA";
const Poppins = "Poppins";

const iconBase =
  "https://presenton.ai/api/update-svg?url=https://presenton-public-eu.s3.eu-central-1.amazonaws.com/static/icons/bold";
const assetBase =
  "https://presenton-public-eu.s3.eu-central-1.amazonaws.com/users/1d5ec2f2-3119-4132-b483-df5c3c6b05c4";

const icons = {
  app: `${iconBase}/google-play-logo-bold.svg&stroke=FFFFFF`,
  bowl: `${iconBase}/bowl-food-bold.svg&stroke=ffffff`,
  calendar: `${iconBase}/calendar-x-bold.svg&stroke=9333EA`,
  coffee: `${iconBase}/coffee-bean-bold.svg&stroke=ffffff`,
  egg: `${iconBase}/egg-bold.svg&stroke=ffffff`,
  fork: `${iconBase}/fork-knife-bold.svg&stroke=FFFFFF`,
  globe: `${iconBase}/globe-stand-bold.svg&stroke=ffffff`,
  golf: `${iconBase}/golf-bold.svg&stroke=ffffff`,
  hamburger: `${iconBase}/hamburger-bold.svg&stroke=ffffff`,
  heart: `${iconBase}/heart-half-bold.svg&stroke=ffffff`,
  hourglass: `${iconBase}/hourglass-bold.svg&stroke=FFFFFF`,
  map: `${iconBase}/map-trifold-bold.svg&stroke=ffffff`,
  numpad: `${iconBase}/numpad-bold.svg&stroke=ffffff`,
  oven: `${iconBase}/oven-bold.svg&stroke=ffffff`,
  pint: `${iconBase}/pint-glass-bold.svg&stroke=ffffff`,
  pizza: `${iconBase}/pizza-bold.svg&stroke=ffffff`,
  rectangle: `${iconBase}/rectangle-bold.svg&stroke=FFFFFF`,
  smiley: `${iconBase}/smiley-bold.svg&stroke=FFFFFF`,
  star: `${iconBase}/star-four-bold.svg&stroke=ffffff`,
  suitcase: `${iconBase}/suitcase-rolling-bold.svg&stroke=ffffff`,
  tea: `${iconBase}/tea-bag-bold.svg&stroke=ffffff`,
  truck: `${iconBase}/truck-bold.svg&stroke=FFFFFF`,
  users: `${iconBase}/users-three-bold.svg&stroke=ffffff`,
  warehouse: `${iconBase}/warehouse-bold.svg&stroke=FFFFFF`,
};

const images = {
  basePanel: `${assetBase}/xml-to-html/5d237c727dfd2de3f40790974a8b40d9.png`,
  bottomCorner: `${assetBase}/xml-to-html/057019908b84585c4b7c5174cfcecdfc.png`,
  cover: `${assetBase}/images/10235c87-374b-4de0-baaf-e08a24c206f4.png`,
  edgeStrip: `${assetBase}/xml-to-html/49096c302cdaa44db5ff9286601a626a.png`,
  sparkle: `${assetBase}/xml-to-html/fd40945b3afb167b982b46cbdf42f9ab.png`,
  collageA: `${assetBase}/images/21aea1bc-d3b0-4dcf-a7ea-20c7c9f0f49d.png`,
  collageB: `${assetBase}/images/c5d557fa-e821-4a6b-84c0-be2bdbe3b6c3.png`,
  collageC: `${assetBase}/images/526bc276-6ed7-4792-bc40-141df9fed11c.png`,
  grid1: `${assetBase}/images/e56e32d5-f62a-4d0f-bee8-c05e4de345dd.png`,
  grid2: `${assetBase}/images/426b8a54-cd87-4e63-a230-745da31da758.png`,
  grid3: `${assetBase}/images/19c6431f-47dc-41e7-8924-d2a9ca058b1a.png`,
  grid4: `${assetBase}/images/59a2c662-3b33-4287-8db4-69e8d6bf3f3a.png`,
  duoA: `${assetBase}/images/4482acce-f6a0-4047-a380-79f1cfab01c1.png`,
  duoB: `${assetBase}/images/d8a93685-1c7e-4325-8fe7-9994dee02bc0.png`,
  duoThumb: `${assetBase}/images/df187891-a14f-463d-8f6a-8fc7e9bd6291.png`,
};

const softShadow = {
  color: "#000000",
  blur: 2,
  opacity: 0.05,
  offsetX: 0,
  offsetY: 1,
};

const cardShadow = {
  color: "#000000",
  blur: 6,
  opacity: 0.1,
  offsetX: 0,
  offsetY: 4,
};

const tableShadow = {
  color: "#000000",
  blur: 30,
  opacity: 0.08,
  offsetX: 0,
  offsetY: 8,
};

function text(
  slot: string,
  x: number,
  y: number,
  width: number,
  height: number,
  value: string,
  size: number,
  color = INK,
  bold?: boolean,
  lineHeight = size * 1.25,
  align?: "left" | "center" | "right",
): DeckSpecElement {
  return {
    type: "text",
    slot,
    position: { x, y },
    size: { width, height },
    font: { family: Poppins, size, color, bold, lineHeight },
    alignment: align ? { horizontal: align, vertical: "top" } : null,
    text: value,
  };
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  radius = 0,
  opacity = 1,
  shadow?: {
    color: string;
    blur: number;
    opacity: number;
    offsetX: number;
    offsetY: number;
  },
): DeckSpecElement {
  return {
    type: "rectangle",
    position: { x, y },
    size: { width, height },
    fill: { color, opacity },
    borderRadius: radius ? { tl: radius, tr: radius, bl: radius, br: radius } : null,
    shadow,
  };
}

function image(
  slot: string,
  x: number,
  y: number,
  width: number,
  height: number,
  data: string | null,
  fit: "cover" | "contain" | "fill" | null = "cover",
): DeckSpecElement {
  return {
    type: "image",
    slot,
    name: slot,
    position: { x, y },
    size: { width, height },
    data,
    fit,
  };
}

function iconBox(iconSlot = "icon", icon = icons.star, box = 48): DeckSpecElement[] {
  const inset = box === 72 ? 18 : box === 56 ? 14 : 12;
  const iconSize = box - inset * 2;
  const shadow = box === 72 ? cardShadow : box === 56 ? softShadow : undefined;
  return [
    rect(0, 0, box, box, PURPLE, 12, 1, shadow),
    image(iconSlot, inset, inset, iconSize, iconSize, icon, "fill"),
  ];
}

function pageNumber(page: number, x: number, y: number) {
  return {
    componentId: "page_number_bottom_right",
    position: { x, y },
    overrides: { page: { text: `${page}/7` } },
  };
}

const pitchDeckSpec: DeckSpec = {
  title: "Taco Bell Pitch Deck",
  description: "A seven-slide editable deck generated from reusable component/layout specs.",
  theme: {
    background: BG,
    surface: SURFACE,
    primary: PURPLE,
    secondary: INK,
    accent: PURPLE,
    text: INK,
    muted: MUTED,
  },
  slideSize: { width: 1280, height: 720 },
  components: [
    {
      id: "cover_media_panel",
      position: { x: 84, y: 160 },
      size: { width: 512, height: 400 },
      elements: [
        rect(0, 0, 512, 400, SURFACE, 16, 1, softShadow),
        image("cover-image", 0, 0, 512, 400, images.cover),
      ],
    },
    {
      id: "cover_text_block",
      position: { x: 668, y: 94 },
      size: { width: 530, height: 533 },
      elements: [
        text("title", 0, 0, 530, 119, "Taco Bell: The Flavor Revolution", 54, INK, true, 59.4),
        rect(0, 143, 80, 4, PURPLE),
        text(
          "body",
          0,
          171,
          530,
          252,
          "Dive into the vibrant world of Taco Bell, a brand that has redefined fast food with its bold flavors and innovative menu items. This presentation explores the extensive variety of tacos, burritos, and specialties that have captivated millions worldwide. We will also examine the seamless digital ordering experience, the strategic expansion of locations in Charlotte, and how Taco Bell continues to lead the market with creative culinary twists and customer-centric initiatives.",
          18,
          MUTED,
          undefined,
          28,
        ),
        rect(0, 455, 528, 78, SURFACE, 16),
        text("author-label", 28, 471, 129, 15, "AUTHOR", 10, SUBTLE, true, 15),
        text("author", 28, 490, 180, 27, "sauravniraula", 18, INK, true, 27),
        rect(175, 478, 1, 32, "D1D5DB"),
        text("date-label", 196, 473, 107, 15, "DATE", 10, SUBTLE, true, 15),
        image("date-icon", 196, 496, 14, 14, icons.calendar, "fill"),
        text("date", 216, 492, 110, 23, "2026-04-21", 15, "374151", undefined, 22.5),
      ],
    },
    {
      id: "page_number_bottom_right",
      position: { x: 1190, y: 664 },
      size: { width: 40, height: 24 },
      elements: [text("page", 0, 0, 40, 24, "1/7", 16, MUTED, false, 24)],
    },
    {
      id: "decorative_left_edge_images",
      position: { x: 0, y: 0 },
      size: { width: 192, height: 720 },
      elements: [
        image("edge-strip", 0, 0, 128, 720, images.edgeStrip),
        image("bottom-corner-image", 0, 592, 192, 128, images.bottomCorner),
      ],
    },
    {
      id: "title_top_left",
      position: { x: 80, y: 48 },
      size: { width: 1122, height: 75 },
      elements: [text("title", 0, 0, 1122, 75, "Slide Title", 60, INK, true, 75)],
    },
    {
      id: "title_top_center",
      position: { x: 80, y: 48 },
      size: { width: 1122, height: 70 },
      elements: [text("title", 0, 0, 1122, 70, "Slide Title", 56, INK, true, 70, "center")],
    },
    {
      id: "icon_bullet_row_large",
      position: { x: 80, y: 212 },
      size: { width: 562, height: 61 },
      elements: [...iconBox("icon", icons.pizza, 56), text("label", 76, 13, 486, 48, "Bullet title or statement", 22, INK, undefined, 30.25)],
    },
    {
      id: "icon_bullet_row_medium",
      position: { x: 80, y: 175 },
      size: { width: 486, height: 69 },
      elements: [
        ...iconBox("icon", icons.tea),
        text("title", 64, 0, 340, 25, "Item title", 20, INK, true, 25),
        rect(64, 33, 48, 2, PURPLE),
        text("description", 64, 47, 370, 22, "Supporting description", 16, MUTED, undefined, 22),
      ],
    },
    {
      id: "feature_card_large",
      position: { x: 180, y: 235 },
      size: { width: 470, height: 169 },
      elements: [
        ...iconBox("icon", icons.app, 72),
        text("title", 96, 0, 374, 35, "Feature title", 28, INK, true, 35),
        rect(96, 51, 64, 4, PURPLE, 2),
        text("description", 96, 71, 376, 98, "Feature description", 20, MUTED, undefined, 32.5),
      ],
    },
    {
      id: "simple_icon_text_row",
      position: { x: 160, y: 158 },
      size: { width: 410, height: 51 },
      elements: [
        ...iconBox("icon"),
        text("title", 68, 0, 342, 24, "Title", 20, INK, true, 24),
        text("description", 68, 28, 342, 23, "Description", 16, MUTED, undefined, 22.4),
      ],
    },
    {
      id: "stats_icon_label",
      position: { x: 97, y: 526 },
      size: { width: 208, height: 89 },
      elements: [
        rect(79, 0, 48, 48, PURPLE, 12),
        image("icon", 91, 12, 24, 24, icons.star, "fill"),
        text("label", 0, 64, 208, 25, "Metric label", 20, INK, true, 25, "center"),
      ],
    },
    {
      id: "image_collage_panel",
      position: { x: 640, y: 145 },
      size: { width: 560, height: 548 },
      elements: [
        image("base-panel", 0, 0, 560, 548, images.basePanel),
        image("corner-icon", 20, 30, 32, 32, images.sparkle, "fill"),
        image("bottom-icon", 496, 484, 24, 24, images.sparkle, "fill"),
        image("image-a", 30, 50, 280, 220, images.collageA),
        image("image-b", 240, 150, 300, 240, images.collageB),
        image("image-c", 40, 338, 260, 180, images.collageC),
      ],
    },
    {
      id: "photo_grid_panel_2x2",
      position: { x: 80, y: 171 },
      size: { width: 528, height: 528 },
      elements: [
        image("base-panel", 0, 0, 528, 528, images.basePanel),
        image("image-1", 24, 24, 228, 228, images.grid1),
        image("image-2", 276, 24, 228, 228, images.grid2),
        image("image-3", 24, 276, 228, 228, images.grid3),
        image("image-4", 276, 276, 228, 228, images.grid4),
      ],
    },
    {
      id: "locations_table_card",
      position: { x: 80, y: 175 },
      size: { width: 1120, height: 232 },
      elements: [
        {
          type: "rectangle",
          position: { x: 0, y: 0 },
          size: { width: 1120, height: 232 },
          fill: { color: BG, opacity: 1 },
          stroke: { color: "F3F4F6", opacity: 1, width: 1 },
          borderRadius: { tl: 16, tr: 16, bl: 16, br: 16 },
          shadow: tableShadow,
        },
        {
          type: "table",
          slot: "table",
          position: { x: 1, y: 1 },
          size: { width: 1118, height: 230 },
          columns: [
            { fill: { color: SURFACE }, stroke: { color: LINE, width: 1 }, text: "Location" },
            { fill: { color: SURFACE }, stroke: { color: LINE, width: 1 }, text: "Address" },
          ],
          rows: [
            [{ text: "Woodlawn Rd" }, { text: "1800 E Woodlawn Rd" }],
            [{ text: "University City" }, { text: "8661 Jw Clay Blvd, Charlotte, NC 28262" }],
          ],
        },
      ],
    },
    {
      id: "section_label_divider",
      position: { x: 80, y: 455 },
      size: { width: 1120, height: 39 },
      elements: [
        text("label", 0, 0, 300, 30, "Customer experience:", 20, INK, true, 30),
        rect(0, 38, 1120, 1, LINE),
      ],
    },
    {
      id: "single_line_icon_list_item",
      position: { x: 640, y: 228 },
      size: { width: 562, height: 55 },
      elements: [...iconBox("icon"), text("label", 68, 0, 494, 55, "List item text", 20, INK, true, 27.5)],
    },
    {
      id: "right_image_duo_panel",
      position: { x: 700, y: 158 },
      size: { width: 500, height: 480 },
      elements: [
        image("base-panel", 0, 0, 500, 480, images.basePanel),
        image("corner-icon", 448, 10, 32, 32, images.sparkle, "fill"),
        image("image-a", 0, 30, 340, 240, images.duoA),
        image("image-b", 160, 210, 340, 240, images.duoB),
      ],
    },
  ],
  layouts: [
    {
      id: "slide_1",
      title: "Cover",
      components: [
        { componentId: "cover_media_panel" },
        { componentId: "cover_text_block" },
        pageNumber(1, 1202, 664),
      ],
    },
    {
      id: "slide_2",
      title: "Brand Overview",
      components: [
        { componentId: "decorative_left_edge_images" },
        {
          componentId: "title_top_left",
          overrides: { title: { text: "Taco Bell: A Yum! Brands Subsidiary" } },
        },
        ...[
          [212, icons.pizza, "Part of Yum! Brands family of restaurants"],
          [304, icons.tea, "Serving Mexican-inspired cuisine since 1962"],
          [398, icons.globe, "Global presence with thousands of locations"],
          [495, icons.star, "Known for bold flavors and creative menu combinations"],
          [592, icons.users, "Community-driven approach to food development"],
        ].map(([y, icon, label]) => ({
          componentId: "icon_bullet_row_large",
          position: { x: 80, y: y as number },
          overrides: { icon: { data: icon as string }, label: { text: label as string } },
        })),
        {
          componentId: "right_image_duo_panel",
          position: { x: 672, y: 181 },
          overrides: {
            "base-panel": { size: { width: 528, height: 500 } },
            "image-a": { position: { x: 40, y: 40 }, size: { width: 448, height: 420 } },
            "image-b": { position: { x: 368, y: 340 }, size: { width: 140, height: 140 }, data: images.duoThumb },
          },
        },
        pageNumber(2, 1174, 672),
      ],
    },
    {
      id: "slide_3",
      title: "Menu Favorites",
      components: [
        { componentId: "title_top_left", overrides: { title: { text: "Menu Favorites & Varieties" } } },
        pageNumber(3, 1171, 68),
        ...[
          [175, icons.tea, "Classic Tacos", "Original Crunchy, Soft Shell, and Supreme versions"],
          [276, icons.coffee, "Signature Burritos", "Bean Burrito, Burrito Supreme, and specialty versions"],
          [377, icons.hamburger, "Quesadillas and Nachos", "Grilled perfection and loaded options"],
          [478, icons.rectangle, "Cravings Kits", "Bring Taco Bell flavors home"],
        ].map(([y, icon, title, description]) => ({
          componentId: "icon_bullet_row_medium",
          position: { x: 80, y: y as number },
          overrides: {
            icon: { data: icon as string },
            title: { text: title as string },
            description: { text: description as string },
          },
        })),
        { componentId: "image_collage_panel" },
      ],
    },
    {
      id: "slide_4",
      title: "Locations",
      components: [
        {
          componentId: "title_top_left",
          position: { x: 80, y: 64 },
          overrides: { title: { text: "Charlotte Locations & Experience" } },
        },
        { componentId: "locations_table_card" },
        { componentId: "section_label_divider" },
        ...[
          [97, icons.star, "3.5 to 4-star ratings"],
          [390, icons.hourglass, "Fast service"],
          [684, icons.smiley, "Friendly staff"],
          [977, icons.fork, "Consistently good food"],
        ].map(([x, icon, label]) => ({
          componentId: "stats_icon_label",
          position: { x: x as number, y: 526 },
          overrides: { icon: { data: icon as string }, label: { text: label as string } },
        })),
        pageNumber(4, 1173, 664),
      ],
    },
    {
      id: "slide_5",
      title: "Ordering",
      components: [
        { componentId: "decorative_left_edge_images" },
        {
          componentId: "title_top_left",
          position: { x: 180, y: 64 },
          overrides: { title: { text: "Convenient Ordering Options", size: { width: 1022, height: 75 } } },
        },
        ...[
          [180, 235, icons.app, "Mobile App", "Order ahead for pickup or delivery"],
          [730, 235, icons.truck, "Uber Eats Partnership", "Browse, customize, and track delivery"],
          [180, 419, icons.rectangle, "At-Home Products", "Crunchwrap Supreme Cravings Kit (22.6 oz) and Queso-Burrito Cravings Kit (21.5 oz)"],
          [730, 419, icons.warehouse, "Flexible Pickup", "In-store, drive-thru, or curbside"],
        ].map(([x, y, icon, title, description]) => ({
          componentId: "feature_card_large",
          position: { x: x as number, y: y as number },
          overrides: {
            icon: { data: icon as string },
            title: { text: title as string },
            description: { text: description as string },
          },
        })),
        pageNumber(5, 1203, 653),
      ],
    },
    {
      id: "slide_6",
      title: "Innovation",
      components: [
        { componentId: "title_top_left", overrides: { title: { text: "Innovation & New Menu Items" } } },
        { componentId: "photo_grid_panel_2x2" },
        ...[
          [228, icons.suitcase, "Triple Double Crunchwrap"],
          [300, icons.numpad, "Diablo nuggets with special seasoning"],
          [372, icons.bowl, "Zab's fries with unique flavor profile"],
          [444, icons.pint, "Dirty Sips beverage collection"],
          [519, icons.coffee, "Grilled cheese burrito with melted cheese sauce"],
          [595, icons.egg, "Crispy Chicken Crunchwrap (two versions)"],
        ].map(([y, icon, label]) => ({
          componentId: "single_line_icon_list_item",
          position: { x: 640, y: y as number },
          overrides: { icon: { data: icon as string }, label: { text: label as string } },
        })),
        pageNumber(6, 1214, 672),
      ],
    },
    {
      id: "slide_7",
      title: "Community",
      components: [
        { componentId: "decorative_left_edge_images" },
        {
          componentId: "title_top_center",
          overrides: { title: { text: "Beyond Food: Community & Events" } },
        },
        ...[
          [158, icons.oven, "Test Kitchen Series", "Behind-the-scenes of menu development"],
          [236, icons.golf, "Taco Bell x Bad Birdie Invitational", "Applications currently open"],
          [315, icons.star, "Customer Feedback Integration", "Driving menu evolution"],
          [393, icons.map, "Regional Testing", "North Carolina trying new items"],
          [472, icons.heart, "Engaging Message", "Your light is finding its home"],
        ].map(([y, icon, title, description]) => ({
          componentId: "simple_icon_text_row",
          position: { x: 160, y: y as number },
          overrides: {
            icon: { data: icon as string },
            title: { text: title as string },
            description: { text: description as string },
          },
        })),
        { componentId: "right_image_duo_panel" },
        pageNumber(7, 1215, 672),
      ],
    },
  ],
};

export const tacoBellDeck = createDeckFromSpec(pitchDeckSpec);
export const tacoBellComponentTemplates = createComponentTemplatesFromSpec(pitchDeckSpec);
