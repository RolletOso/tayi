import type { Leg, Stop, VehicleType } from "./types";
export const vehicleInfo: Record<VehicleType, string> = {
  Keke: "4–5 passengers", "Keke Bus": "8 passengers", "Normal Bus": "14–18 passengers", "Coaster Bus": "23–30 passengers"
};
export const stops: Stop[] = [
  {id:"mile1",name:"Mile 1 Park",area:"Diobu",landmark:"Main Mile 1 motor park",aliases:["Mile 1","Mile One","Mile 1 Market","Mile 1 motor park"]},
  {id:"rumuokoro",name:"Rumuokoro",area:"Obio/Akpor",landmark:"Rumuokoro roundabout",aliases:["Rumuokoro roundabout","Rumuokoro junction","Rumuokoro flyover"]},
  {id:"choba",name:"Choba",area:"Obio/Akpor",landmark:"Choba junction",aliases:["Choba junction","Choba market"]},
  {id:"uniport",name:"UNIPORT Main Gate",area:"Choba",landmark:"University of Port Harcourt main gate",aliases:["UNIPORT","University of Port Harcourt","Uniport main gate"]},
  {id:"garrison",name:"Garrison",area:"Port Harcourt",landmark:"Garrison junction",aliases:["Garrison junction","Garrison bus stop"]},
  {id:"rumuola",name:"Rumuola",area:"Obio/Akpor",landmark:"Rumuola junction",aliases:["Rumuola junction","Rumuola roundabout"]},
  {id:"artillery",name:"Artillery",area:"Trans Amadi",landmark:"Artillery junction",aliases:["Artillery junction","Trans Amadi"]},
  {id:"waterlines",name:"Waterlines",area:"Port Harcourt",landmark:"Waterlines bus stop",aliases:["Waterlines bus stop","Waterlines junction"]}
];
export const legs: Leg[] = [
  {id:"m1-rk",from:"mile1",to:"rumuokoro",vehicle:"Normal Bus",heading:"Rumuokoro / Choba",boardAt:"Mile 1 Park",dropAt:"Rumuokoro roundabout",landmarks:["Mile 1 motor park","Rumuokoro roundabout"],minutes:[20,30],fare:[500,700],lastConfirmed:"Sample only"},
  {id:"rk-choba",from:"rumuokoro",to:"choba",vehicle:"Coaster Bus",heading:"Choba",boardAt:"Rumuokoro roundabout",dropAt:"Choba junction",landmarks:["Rumuokoro roundabout","Choba junction"],minutes:[20,30],fare:null,lastConfirmed:null},
  {id:"choba-uni",from:"choba",to:"uniport",vehicle:"Keke",heading:"UNIPORT",boardAt:"Choba junction",dropAt:"UNIPORT Main Gate",landmarks:["Choba junction","University main gate"],minutes:[8,12],fare:[200,300],lastConfirmed:"Sample only"},
  {id:"m1-gar",from:"mile1",to:"garrison",vehicle:"Normal Bus",heading:"Garrison",boardAt:"Mile 1 Park",dropAt:"Garrison junction",landmarks:["Mile 1 Park","Garrison junction"],minutes:[15,25],fare:[300,500],lastConfirmed:"Sample only"},
  {id:"gar-rum",from:"garrison",to:"rumuola",vehicle:"Keke Bus",heading:"Rumuola",boardAt:"Garrison junction",dropAt:"Rumuola junction",landmarks:["Garrison junction","Rumuola junction"],minutes:[10,15],fare:[200,300],lastConfirmed:"Sample only"},
  {id:"rum-rk",from:"rumuola",to:"rumuokoro",vehicle:"Keke",heading:"Rumuokoro",boardAt:"Rumuola junction",dropAt:"Rumuokoro roundabout",landmarks:["Rumuola junction","Rumuokoro roundabout"],minutes:[8,12],fare:[150,250],lastConfirmed:"Sample only"},
  {id:"gar-water",from:"garrison",to:"waterlines",vehicle:"Keke",heading:"Waterlines",boardAt:"Garrison junction",dropAt:"Waterlines bus stop",landmarks:["Garrison junction","Waterlines"],minutes:[10,16],fare:null,lastConfirmed:null},
  {id:"water-rum",from:"waterlines",to:"rumuola",vehicle:"Normal Bus",heading:"Rumuola",boardAt:"Waterlines bus stop",dropAt:"Rumuola junction",landmarks:["Waterlines","Rumuola junction"],minutes:[12,18],fare:[250,400],lastConfirmed:"Sample only"},
  {id:"rum-art",from:"rumuola",to:"artillery",vehicle:"Keke Bus",heading:"Artillery / Trans Amadi",boardAt:"Rumuola junction",dropAt:"Artillery junction",landmarks:["Rumuola junction","Artillery junction"],minutes:[12,20],fare:[250,400],lastConfirmed:"Sample only"}
];
export const categories = [
  {label:"Markets",icon:"🧺",examples:["Mile 1 Market","Choba market"]},
  {label:"Schools",icon:"🎓",examples:["UNIPORT","Choba"]},
  {label:"Hospitals",icon:"🏥",examples:["Waterlines","Garrison"]},
  {label:"Transport hubs",icon:"🚌",examples:["Mile 1 Park","Waterlines"]},
  {label:"Malls & hotels",icon:"🏬",examples:["Rumuokoro","Rumuola"]},
  {label:"Other places",icon:"📍",examples:["Garrison","Artillery"]}
];
export function resolveStop(value: string): Stop | undefined {
  const q=value.trim().toLowerCase().replace(/\s+/g," ");
  if(!q) return undefined;
  return stops.find(s=>[s.name,...s.aliases].some(x=>x.toLowerCase()===q))
    ?? stops.find(s=>[s.name,...s.aliases].some(x=>x.toLowerCase().includes(q)||q.includes(x.toLowerCase())));
}
export function formatNaira(value:number):string { return "₦"+Math.round(value).toLocaleString("en-NG"); }