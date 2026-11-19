import { legs } from "./data";
import type { RouteLeg, Trip } from "./types";
function neighbours(stopId:string):RouteLeg[] {
  const out:RouteLeg[]=[];
  for(const leg of legs){
    if(leg.from===stopId) out.push({...leg,direction:"forward",start:leg.from,end:leg.to});
    if(leg.to===stopId) out.push({...leg,direction:"reverse",start:leg.to,end:leg.from});
  }
  return out;
}
export function findTrips(from:string,to:string):Trip[] {
  if(from===to) return [];
  const queue:{at:string;route:RouteLeg[];visited:Set<string>}[]=[{at:from,route:[],visited:new Set([from])}];
  const found:RouteLeg[][]=[];
  while(queue.length&&found.length<12){
    const current=queue.shift()!;
    if(current.route.length>=5) continue;
    for(const next of neighbours(current.at)){
      if(current.visited.has(next.end)) continue;
      const route=[...current.route,next];
      if(next.end===to) found.push(route);
      else {const visited=new Set(current.visited);visited.add(next.end);queue.push({at:next.end,route,visited});}
    }
  }
  return found.map((route,index)=>{
    const min=route.reduce((n,l)=>n+l.minutes[0],0), max=route.reduce((n,l)=>n+l.minutes[1],0);
    const priced=route.filter(l=>l.fare);
    return {id:route.map(l=>l.id+(l.direction==="reverse"?"r":"f")).join("-")+index,from,to,legs:route,minutes:[min,max],pricedFare:[priced.reduce((n,l)=>n+(l.fare?.[0]??0),0),priced.reduce((n,l)=>n+(l.fare?.[1]??0),0)],unpricedCount:route.filter(l=>!l.fare).length,changes:Math.max(0,route.length-1)};
  });
}
export function rankTrips(trips:Trip[],style:string):Trip[]{
  return [...trips].sort((a,b)=>{
    if(style==="Cheapest") return ((a.pricedFare[0]+a.pricedFare[1])/2)-((b.pricedFare[0]+b.pricedFare[1])/2)||a.changes-b.changes;
    if(style==="Fastest") return a.minutes[0]-b.minutes[0]||a.changes-b.changes;
    if(style==="Fewest changes"||style==="Easiest for visitors"||style==="Better at night") return a.changes-b.changes||a.minutes[0]-b.minutes[0];
    return 0;
  });
}