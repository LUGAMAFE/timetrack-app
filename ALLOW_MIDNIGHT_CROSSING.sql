-- =============================================
-- ALLOW BLOCKS THAT CROSS MIDNIGHT
-- =============================================
-- Permite bloques como "23:00 - 05:00" (dormir de 11 PM a 5 AM)

-- 1. Eliminar el CHECK constraint que impide end_time <= start_time
ALTER TABLE scheduled_blocks DROP CONSTRAINT IF EXISTS scheduled_blocks_check;
ALTER TABLE scheduled_blocks DROP CONSTRAINT IF EXISTS scheduled_blocks_end_time_check;

-- 2. Hacer lo mismo para template_blocks
ALTER TABLE template_blocks DROP CONSTRAINT IF EXISTS template_blocks_check;
ALTER TABLE template_blocks DROP CONSTRAINT IF EXISTS template_blocks_end_time_check;

-- 3. Agregar columna opcional para indicar si cruza medianoche (para calculos)
ALTER TABLE scheduled_blocks ADD COLUMN IF NOT EXISTS crosses_midnight BOOLEAN DEFAULT false;
ALTER TABLE template_blocks ADD COLUMN IF NOT EXISTS crosses_midnight BOOLEAN DEFAULT false;

-- 4. Actualizar bloques existentes que cruzan medianoche
UPDATE scheduled_blocks SET crosses_midnight = true WHERE end_time < start_time;
UPDATE template_blocks SET crosses_midnight = true WHERE end_time < start_time;

-- 5. Crear funcion para calcular duracion correctamente
CREATE OR REPLACE FUNCTION calculate_block_duration(start_t TIME, end_t TIME, crosses_midnight BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
  IF crosses_midnight OR end_t < start_t THEN
    -- Cruza medianoche: (24:00 - start) + end
    RETURN EXTRACT(EPOCH FROM (TIME '24:00:00' - start_t + end_t)) / 60;
  ELSE
    -- Normal: end - start
    RETURN EXTRACT(EPOCH FROM (end_t - start_t)) / 60;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_block_duration IS 'Calcula duracion en minutos, manejando bloques que cruzan medianoche';
