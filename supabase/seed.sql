-- Generado desde web/src/data/catalog.ts. DEMO; sin usuarios ni administradores.
-- Regenerar: cd web && npm run seed:generate. Revisar antes de aplicar SQL.
begin;
insert into public.categories (id, name, description, is_active) values
  ('componentes', 'Componentes', 'Pequeñas piezas, grandes posibilidades.', true),
  ('desarrollo', 'Desarrollo', 'Del primer circuito al siguiente prototipo.', true),
  ('herramientas', 'Herramientas', 'Mide, conecta y construye con precisión.', true),
  ('energia', 'Energía', 'El punto de partida de tus proyectos.', true)
on conflict (id) do update set name = excluded.name, description = excluded.description, is_active = excluded.is_active;

insert into public.products (sku, name, description, category_id, price_cents, stock_demo, is_active) values
  ('ES-C001', 'Kit de resistencias 220 Ω', 'Un conjunto ficticio de 20 resistencias para explorar divisores de voltaje en prácticas académicas.', 'componentes', 3500, 24, true),
  ('ES-C002', 'LED violeta · 10 piezas', 'Indicadores de 5 mm para experimentar con señales luminosas. Especificaciones ilustrativas.', 'componentes', 2800, 18, true),
  ('ES-C003', 'Capacitor cerámico · kit', 'Selección demo de capacitores para estudiar filtrado y temporización en circuitos sencillos.', 'componentes', 4200, 0, true),
  ('ES-C004', 'Pulsadores de práctica', 'Diez pulsadores ficticios de montaje para ejercicios de entradas digitales.', 'componentes', 3200, 12, true),
  ('ES-D001', 'Placa de desarrollo Nova', 'Placa ficticia para imaginar proyectos con entradas y salidas digitales. No representa un modelo comercial.', 'desarrollo', 24900, 8, true),
  ('ES-D002', 'Protoboard de laboratorio', 'Base demo de 400 puntos para planear conexiones sin soldadura en el aula.', 'desarrollo', 7900, 20, true),
  ('ES-D003', 'Cables puente · 40 piezas', 'Juego ficticio de cables para distribuir conexiones en montajes de aprendizaje.', 'desarrollo', 5900, 15, true),
  ('ES-D004', 'Sensor de luz Aurora', 'Módulo conceptual para explorar lecturas de iluminación y automatización educativa.', 'desarrollo', 8900, 0, true),
  ('ES-H001', 'Multímetro de práctica', 'Instrumento ficticio para presentar mediciones básicas. No usar estos datos como guía de seguridad eléctrica.', 'herramientas', 31900, 6, true),
  ('ES-H002', 'Pinza de corte fino', 'Herramienta demo para ilustrar el equipamiento de una mesa de prototipado.', 'herramientas', 11900, 9, true),
  ('ES-H003', 'Soporte de soldadura', 'Soporte conceptual de banco para organizar prácticas supervisadas de montaje.', 'herramientas', 15900, 4, true),
  ('ES-H004', 'Destornilladores de precisión', 'Estuche ficticio de seis puntas para proyectos de electrónica educativa.', 'herramientas', 17900, 0, true),
  ('ES-E001', 'Fuente de banco Mini', 'Fuente conceptual para maquetas de laboratorio. Datos de demostración, sin certificación ni uso real.', 'energia', 64900, 3, true),
  ('ES-E002', 'Portapilas de práctica', 'Soporte ficticio para dos pilas AA destinado a ejemplos de alimentación portátil.', 'energia', 2500, 30, true),
  ('ES-E003', 'Módulo regulador Delta', 'Módulo conceptual para estudiar regulación de tensión en proyectos de clase.', 'energia', 6900, 11, true),
  ('ES-E004', 'Cable de alimentación USB', 'Cable demo de un metro para representar conexiones de alimentación de baja tensión.', 'energia', 4900, 16, true)
on conflict (sku) do update set name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  stock_demo = excluded.stock_demo, is_active = excluded.is_active;
commit;
