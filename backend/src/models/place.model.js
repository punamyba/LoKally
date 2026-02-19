// ================================================================
// models/place.model.js
// ================================================================
// Model matlab = database sanga directly kura garne file
// Yaha sabai PostgreSQL queries xa
// Controller ley yo file call garxa
//
// NOTE: MySQL bata alag xa PostgreSQL --
//   MySQL  = AUTO_INCREMENT
//   PostgreSQL = SERIAL  (auto increment)
//
//   MySQL  = ? placeholder
//   PostgreSQL = $1 $2 $3 placeholder
// ================================================================

import pool from "../config/db.js"; // tero existing db.js bata connection liyeko

// ----------------------------------------------------------------
// STEP 1: PLACES TABLE BANAU (server start huda ek palta run hunxa)
// ----------------------------------------------------------------
// IF NOT EXISTS = table pahile nai xa bhane error audaina, skip garxa

export const createPlacesTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS places (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255)  NOT NULL,
      address     VARCHAR(500)  NOT NULL,
      description TEXT,
      category    VARCHAR(100),
      lat         DECIMAL(10, 7) NOT NULL,
      lng         DECIMAL(10, 7) NOT NULL,
      image       VARCHAR(500),
      created_by  INT NOT NULL,
      verified    BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  // NOTE: PostgreSQL ma FOREIGN KEY add garna users table ko structure thaha hunuparxa
  // Simple rakhna FK hatayeko -- created_by INT matra rakho, manually match garxa
  await pool.query(sql);
};

// ----------------------------------------------------------------
// STEP 2: NAYA PLACE INSERT GARA
// ----------------------------------------------------------------
// PostgreSQL ma placeholder = $1, $2, $3 ... (MySQL ma ? thiyo)
// RETURNING * = insert garesi naya row nai farkauxa (MySQL ma alag query garnu parthyo)

export const insertPlace = async ({ name, address, description, category, lat, lng, image, created_by }) => {
  const sql = `
    INSERT INTO places (name, address, description, category, lat, lng, image, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [name, address, description, category, lat, lng, image, created_by];
  const { rows } = await pool.query(sql, values);
  return rows[0]; // naya baneko place nai farkauxa
};

// ----------------------------------------------------------------
// STEP 3: SABAI PLACES LIYA (explore map / list page ko lagi)
// ----------------------------------------------------------------

export const getAllPlaces = async () => {
  const { rows } = await pool.query(`SELECT * FROM places ORDER BY created_at DESC`);
  return rows; // array farkauxa
};

// ----------------------------------------------------------------
// STEP 4: EK OTA PLACE LIYA (single detail page ko lagi)
// ----------------------------------------------------------------

export const getPlaceById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM places WHERE id = $1`, [id]);
  return rows[0]; // nabhaye undefined
};

// ----------------------------------------------------------------
// STEP 5: FEATURED PLACES LIYA (home page ko lagi)
// ----------------------------------------------------------------
// Verified first, tespachi newest -- max 6 ota

export const getFeaturedPlaces = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM places
    ORDER BY verified DESC, created_at DESC
    LIMIT 6
  `);
  return rows;
};

// ----------------------------------------------------------------
// STEP 6: STATS / COUNTS (home page numbers ko lagi)
// ----------------------------------------------------------------
// PostgreSQL ma COUNT() = string farkauxa so parseInt garnu parxa

export const getStats = async () => {
  const { rows: p } = await pool.query(`SELECT COUNT(*) AS total FROM places`);
  const { rows: v } = await pool.query(`SELECT COUNT(*) AS verified FROM places WHERE verified = true`);
  const { rows: u } = await pool.query(`SELECT COUNT(*) AS users FROM users`);

  return {
    total:    parseInt(p[0].total),    // string -> number
    verified: parseInt(v[0].verified),
    users:    parseInt(u[0].users),
  };
};

// ----------------------------------------------------------------
// STEP 7: PLACE UPDATE GARA (sirf owner ley garna sakxa)
// ----------------------------------------------------------------
// PostgreSQL ma dynamic SET clause = $1, $2 ... index track garnu parxa

export const updatePlace = async (id, created_by, fields) => {
  const allowed = ["name", "address", "description", "category", "lat", "lng", "image"];
  const updates = [];
  const values  = [];
  let   idx     = 1; // PostgreSQL placeholder index -- $1, $2, $3 ...

  allowed.forEach((key) => {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${idx}`); // eg: "name = $1"
      values.push(fields[key]);
      idx++;
    }
  });

  if (updates.length === 0) return 0;

  // WHERE clause ko lagi id ra created_by thapxa
  values.push(id);         // $idx
  values.push(created_by); // $idx+1

  const sql = `
    UPDATE places
    SET ${updates.join(", ")}
    WHERE id = $${idx} AND created_by = $${idx + 1}
    RETURNING *
  `;

  const { rowCount } = await pool.query(sql, values);
  return rowCount; // 0 = place nabhayo ya owner hoina
};

// ----------------------------------------------------------------
// STEP 8: PLACE DELETE GARA (sirf owner ley garna sakxa)
// ----------------------------------------------------------------

export const deletePlace = async (id, created_by) => {
  const { rowCount } = await pool.query(
    `DELETE FROM places WHERE id = $1 AND created_by = $2`,
    [id, created_by]
  );
  return rowCount; // 0 = nabhayo ya owner hoina
};