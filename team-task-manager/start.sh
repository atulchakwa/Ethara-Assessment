#!/bin/bash

# Start MongoDB in background
echo "Starting MongoDB..."
nohup mongod --dbpath ~/data/db --bind_ip 127.0.0.1 --port 27018 > /tmp/mongodb.log 2>&1 &
MONGOPID=$!
echo "MongoDB PID: $MONGOPID"

# Wait for MongoDB to start
sleep 3
until mongosh --quiet --eval "db.adminCommand('ping')" 2>/dev/null; do
  echo "Waiting for MongoDB..."
  sleep 2
done
echo "MongoDB is ready!"

# Start the server in background
echo "Starting server..."
nohup npm run dev > /tmp/server.log 2>&1 &
SERVERPID=$!
echo "Server PID: $SERVERPID"

echo ""
echo "Both services started!"
echo "MongoDB: PID $MONGOPID"
echo "Server:  PID $SERVERPID"
echo ""
echo "To view logs:"
echo "  MongoDB: tail -f /tmp/mongodb.log"
echo "  Server:  tail -f /tmp/server.log"
echo ""
echo "Frontend: npm run dev (in client folder)"