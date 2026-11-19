insert into public.vehicle_types(id,label,min_capacity,max_capacity,sort_order) values
('keke','Keke (tricycle)',4,5,1),('keke_bus','Keke Bus',8,8,2),('normal_bus','Normal Bus',14,18,3),('coaster_bus','Coaster Bus',23,30,4)
on conflict(id) do update set label=excluded.label,min_capacity=excluded.min_capacity,max_capacity=excluded.max_capacity,sort_order=excluded.sort_order;
insert into public.cities(name,state,country,slug) values('Port Harcourt','Rivers State','Nigeria','port-harcourt') on conflict(slug) do nothing;
-- Add reviewed stops, places, route legs and fares only after field verification.
-- See src/data.ts for clearly labelled sample routes used by the browser preview.