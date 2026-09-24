# Gestión 3D - Aplicación Web

Aplicación web completa, profesional y escalable para la gestión de un negocio de fabricación 3D y venta de insertos. Diseñada para ejecutarse 100% en capas gratuitas.

## Tecnologías Utilizadas
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Shadcn/UI, Lucide Icons, Recharts.
- **Backend**: Next.js Server Actions, Prisma ORM.
- **Base de Datos**: PostgreSQL (optimizado para Supabase/Neon).

## Guía de Despliegue (100% Capa Gratuita)

Esta aplicación está construida para tener un **costo mensual de $0**. Sigue estos pasos para desplegarla en producción.

### 1. Configurar la Base de Datos en Neon o Supabase
1. Crea una cuenta gratuita en [Neon.tech](https://neon.tech/) o [Supabase](https://supabase.com/).
2. Crea un nuevo proyecto/base de datos PostgreSQL.
3. Copia el `DATABASE_URL` (Connection String). Asegúrate de que termina en `?sslmode=require` si estás en Neon.

### 2. Despliegue en Vercel
1. Sube tu código a un repositorio en GitHub.
2. Inicia sesión en [Vercel](https://vercel.com/) y dale clic a "Add New Project".
3. Importa tu repositorio de GitHub.
4. En la sección de **Environment Variables**, añade:
   - `DATABASE_URL` = (Pega aquí la URL que obtuviste en el paso 1)
5. En los ajustes de Build (Build Settings), asegúrate de que el "Build Command" sea `npm run build` o que reconozca el framework Next.js automáticamente. Prisma generará el cliente automáticamente en Vercel durante el build (gracias al paso `prisma generate` que corre antes).
6. Haz clic en **Deploy**.

### 3. Sincronizar el Esquema de Base de Datos
Una vez desplegado (o localmente antes de desplegar), necesitas construir las tablas en tu base de datos:
```bash
npx prisma db push
```

### 4. Poblar Datos Iniciales (Seed)
Para agregar los datos por defecto (Inversiones base y catálogo de 18 productos):
```bash
npm run prisma -- seed
```
*(Si no funciona localmente en Windows, puedes correr: `npx tsx prisma/seed.ts`)*

¡Listo! Tu aplicación estará funcionando en tu dominio `.vercel.app` sin costo alguno.
