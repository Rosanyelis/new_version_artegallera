#!/usr/bin/env bash
#
# Backup de PostgreSQL (contenedor Docker) con retención y verificación de restauración.
#
# Uso:
#   scripts/backup.sh                 # crea un dump comprimido en backups/
#   scripts/backup.sh --verify        # además restaura en una BD temporal, valida y la elimina
#   scripts/backup.sh --list          # lista los backups existentes
#
# Configuración vía variables de entorno (valores por defecto para el proyecto):
#   POSTGRES_CONTAINER  (default: artegallera-postgres-1)
#   POSTGRES_USER       (default: artegallera)
#   POSTGRES_DB         (default: artegallera)
#   BACKUP_DIR          (default: backups)
#   BACKUP_RETENTION    (default: 7)

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-artegallera-postgres-1}"
PGUSER="${POSTGRES_USER:-artegallera}"
PGDB="${POSTGRES_DB:-artegallera}"
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION="${BACKUP_RETENTION:-7}"

MODE="backup"
if [[ "${1:-}" == "--verify" ]]; then MODE="verify"; fi
if [[ "${1:-}" == "--list" ]]; then MODE="list"; fi

mkdir -p "$BACKUP_DIR"

list() {
  ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | sort -r || echo "No hay backups todavía."
}

cleanup() {
  docker exec "$CONTAINER" psql -U "$PGUSER" -d postgres -q -c "DROP DATABASE IF EXISTS ${PGDB}_restore_check;" >/dev/null 2>&1 || true
}

case "$MODE" in
  list)
    list
    exit 0
    ;;
  verify)
    if ! docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -q true; then
      echo "El contenedor $CONTAINER no está disponible."
      exit 1
    fi
    ;;
esac

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="$BACKUP_DIR/${PGDB}-${STAMP}.sql.gz"

echo "[backup] volcando $PGDB desde $CONTAINER..."
docker exec "$CONTAINER" pg_dump -U "$PGUSER" -d "$PGDB" --format=plain --no-owner | gzip > "$DUMP"
SIZE="$(du -h "$DUMP" | cut -f1)"
echo "[backup] creado $DUMP ($SIZE)"

echo "[backup] aplicando retención (máximo $RETENTION backups)..."
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +$((RETENTION + 1)) | while read -r old; do
  echo "[backup] eliminando $old"
  rm -f "$old"
done

if [[ "$MODE" == "verify" ]]; then
  echo "[verify] restaurando en BD temporal ${PGDB}_restore_check..."
  cleanup
  docker exec "$CONTAINER" createdb -U "$PGUSER" -T template0 "${PGDB}_restore_check"
  if ! gunzip -c "$DUMP" | docker exec -i "$CONTAINER" psql -U "$PGUSER" -d "${PGDB}_restore_check" -q >/dev/null; then
    echo "[verify] ERROR: la restauración falló."
    cleanup
    exit 1
  fi

  echo "[verify] validando datos restaurados..."
  CHECK="$(docker exec "$CONTAINER" psql -U "$PGUSER" -d "${PGDB}_restore_check" -t -c \
    "SELECT 'users='||count(*)||' events='||(SELECT count(*) FROM events)||' bets='||(SELECT count(*) FROM bets)||' transactions='||(SELECT count(*) FROM wallet_transactions) FROM users;")"
  echo "[verify] $CHECK"
  docker exec "$CONTAINER" psql -U "$PGUSER" -d "${PGDB}_restore_check" -t -c \
    "SELECT (SELECT count(*) FROM wallet_transactions) = (SELECT count(*) FROM wallet_transactions WHERE status='posted') AS ledger_integrity;" \
    | tr -d ' \n'
  echo ""
  cleanup
  echo "[verify] restauración correcta."
fi