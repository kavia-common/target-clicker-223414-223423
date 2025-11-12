#!/bin/bash
cd /home/kavia/workspace/code-generation/target-clicker-223414-223423/click_quest_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

