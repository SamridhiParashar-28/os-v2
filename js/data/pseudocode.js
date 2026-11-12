// Educational Pseudocode & Explanations Repository
window.OS_PSEUDOCODE = {
  producerConsumer: {
    title: "Producer-Consumer with Counting & Binary Semaphores",
    semaphores: [
      { name: "mutex", initial: 1, purpose: "Ensures mutual exclusion on buffer access (binary semaphore)" },
      { name: "empty", initial: "BUFFER_SIZE", purpose: "Counts empty buffer slots available for producing" },
      { name: "full", initial: 0, purpose: "Counts occupied slots containing items ready for consuming" }
    ],
    code: [
      { line: 1, text: "// Producer Process", type: "comment" },
      { line: 2, text: "item = produce_item();", type: "code", phase: "produce" },
      { line: 3, text: "wait(empty);  // Decrement empty slot count", type: "code", phase: "wait_empty" },
      { line: 4, text: "wait(mutex);  // Enter critical section", type: "code", phase: "wait_mutex" },
      { line: 5, text: "buffer[in] = item; in = (in + 1) % SIZE;", type: "code", phase: "insert" },
      { line: 6, text: "signal(mutex); // Exit critical section", type: "code", phase: "signal_mutex" },
      { line: 7, text: "signal(full);  // Increment filled slot count", type: "code", phase: "signal_full" },
      { line: 8, text: "", type: "empty" },
      { line: 9, text: "// Consumer Process", type: "comment" },
      { line: 10, text: "wait(full);   // Decrement filled slot count", type: "code", phase: "wait_full" },
      { line: 11, text: "wait(mutex);  // Enter critical section", type: "code", phase: "wait_mutex_c" },
      { line: 12, text: "item = buffer[out]; out = (out + 1) % SIZE;", type: "code", phase: "remove" },
      { line: 13, text: "signal(mutex); // Exit critical section", type: "code", phase: "signal_mutex_c" },
      { line: 14, text: "signal(empty); // Increment empty slot count", type: "code", phase: "signal_empty" },
      { line: 15, text: "consume_item(item);", type: "code", phase: "consume" }
    ],
    theory: "The Producer-Consumer (bounded-buffer) problem requires balancing two asynchronous processes. Producers must sleep when the buffer is full, and consumers must sleep when the buffer is empty. Race conditions on buffer index pointers are prevented using the binary semaphore 'mutex'."
  },

  readersWriters: {
    title: "Readers-Writers Problem (First Readers-Writers / Reader Preference)",
    semaphores: [
      { name: "rw_mutex", initial: 1, purpose: "Mutual exclusion for writers; also locked by first reader" },
      { name: "mutex", initial: 1, purpose: "Mutual exclusion when updating 'read_count'" }
    ],
    code: [
      { line: 1, text: "// Writer Process", type: "comment" },
      { line: 2, text: "wait(rw_mutex); // Request exclusive access", type: "code", phase: "writer_wait" },
      { line: 3, text: "/* Writing to shared database */", type: "code", phase: "writer_writing" },
      { line: 4, text: "signal(rw_mutex); // Release database lock", type: "code", phase: "writer_signal" },
      { line: 5, text: "", type: "empty" },
      { line: 6, text: "// Reader Process", type: "comment" },
      { line: 7, text: "wait(mutex);", type: "code", phase: "reader_mutex1" },
      { line: 8, text: "read_count++;", type: "code", phase: "reader_inc" },
      { line: 9, text: "if (read_count == 1) wait(rw_mutex); // 1st reader locks writer", type: "code", phase: "reader_lock_writer" },
      { line: 10, text: "signal(mutex);", type: "code", phase: "reader_signal1" },
      { line: 11, text: "/* Reading shared database concurrently */", type: "code", phase: "reader_reading" },
      { line: 12, text: "wait(mutex);", type: "code", phase: "reader_mutex2" },
      { line: 13, text: "read_count--;", type: "code", phase: "reader_dec" },
      { line: 14, text: "if (read_count == 0) signal(rw_mutex); // Last reader releases", type: "code", phase: "reader_release_writer" },
      { line: 15, text: "signal(mutex);", type: "code", phase: "reader_signal2" }
    ],
    theory: "Multiple readers may read simultaneously without interference. However, writers require exclusive access (no other reader or writer allowed). In reader preference, writers may suffer starvation if a continuous stream of readers arrives."
  },

  diningPhilosophers: {
    title: "Dining Philosophers Problem (Dijkstra)",
    semaphores: [
      { name: "chopstick[5]", initial: "[1, 1, 1, 1, 1]", purpose: "One semaphore per chopstick/fork" }
    ],
    code: [
      { line: 1, text: "// Philosopher i (0 to 4)", type: "comment" },
      { line: 2, text: "while (true) {", type: "code" },
      { line: 3, text: "  think();", type: "code", phase: "think" },
      { line: 4, text: "  // Asymmetric fork pickup (avoids deadlock):", type: "comment" },
      { line: 5, text: "  if (i % 2 == 0) {", type: "code" },
      { line: 6, text: "    wait(chopstick[i]);", type: "code", phase: "left_fork" },
      { line: 7, text: "    wait(chopstick[(i + 1) % 5]);", type: "code", phase: "right_fork" },
      { line: 8, text: "  } else {", type: "code" },
      { line: 9, text: "    wait(chopstick[(i + 1) % 5]);", type: "code", phase: "right_fork" },
      { line: 10, text: "    wait(chopstick[i]);", type: "code", phase: "left_fork" },
      { line: 11, text: "  }", type: "code" },
      { line: 12, text: "  eat();", type: "code", phase: "eat" },
      { line: 13, text: "  signal(chopstick[i]);", type: "code", phase: "drop_left" },
      { line: 14, text: "  signal(chopstick[(i + 1) % 5]);", type: "code", phase: "drop_right" },
      { line: 15, text: "}", type: "code" }
    ],
    theory: "Five philosophers spend their lives thinking and eating rice. To eat, a philosopher needs both their left and right chopsticks. Deadlock occurs if all philosophers grab their left chopstick at the same time and wait endlessly for the right. Asymmetric pickup breaks circular wait."
  },

  sleepingBarber: {
    title: "Sleeping Barber Problem (Queueing Synchronization)",
    semaphores: [
      { name: "customers", initial: 0, purpose: "Number of waiting customers ready for a haircut" },
      { name: "barber", initial: 0, purpose: "Barber readiness state (1 if ready to cut, 0 if sleeping)" },
      { name: "mutex", initial: 1, purpose: "Protects shared access to waiting count variable" }
    ],
    code: [
      { line: 1, text: "// Barber Thread", type: "comment" },
      { line: 2, text: "while (true) {", type: "code" },
      { line: 3, text: "  wait(customers); // Sleep until a customer arrives", type: "code", phase: "barber_sleep" },
      { line: 4, text: "  wait(mutex);", type: "code" },
      { line: 5, text: "  waiting--;       // One customer leaves waiting chair", type: "code", phase: "barber_seat" },
      { line: 6, text: "  signal(barber);  // Ready to give haircut", type: "code", phase: "barber_cut" },
      { line: 7, text: "  signal(mutex);", type: "code" },
      { line: 8, text: "  cut_hair();", type: "code", phase: "cutting" },
      { line: 9, text: "}", type: "code" },
      { line: 10, text: "", type: "empty" },
      { line: 11, text: "// Customer Thread", type: "comment" },
      { line: 12, text: "wait(mutex);", type: "code" },
      { line: 13, text: "if (waiting < NUM_CHAIRS) {", type: "code", phase: "check_chairs" },
      { line: 14, text: "  waiting++;", type: "code" },
      { line: 15, text: "  signal(customers); // Wake barber if asleep", type: "code", phase: "wake_barber" },
      { line: 16, text: "  signal(mutex);", type: "code" },
      { line: 17, text: "  wait(barber);      // Wait for barber's turn", type: "code" },
      { line: 18, text: "  get_haircut();", type: "code" },
      { line: 19, text: "} else {", type: "code" },
      { line: 20, text: "  signal(mutex);     // Shop full: customer leaves", type: "code", phase: "leave" },
      { line: 21, text: "}", type: "code" }
    ],
    theory: "The barber sleeps when no customers are present. When a customer arrives, they either wake the barber or sit in a waiting chair. If all waiting chairs are full, the arriving customer leaves (balking). Coordination requires mutual exclusion on the chair count and rendezvous signaling."
  },

  petersons: {
    title: "Peterson's Algorithm for Two Processes",
    semaphores: [
      { name: "flag[2]", initial: "[false, false]", purpose: "Indicates whether a process is ready to enter critical section" },
      { name: "turn", initial: "0 or 1", purpose: "Indicates whose turn it is to enter the critical section" }
    ],
    code: [
      { line: 1, text: "// Process i (0 or 1), other is j (1 - i)", type: "comment" },
      { line: 2, text: "flag[i] = true;        // Declare intent to enter CS", type: "code", phase: "flag_true" },
      { line: 3, text: "turn = j;               // Be polite: give turn to other process", type: "code", phase: "set_turn" },
      { line: 4, text: "while (flag[j] && turn == j); // Busy wait (spin lock)", type: "code", phase: "busy_wait" },
      { line: 5, text: "/* Critical Section */", type: "code", phase: "in_cs" },
      { line: 6, text: "flag[i] = false;       // Exit: release intent", type: "code", phase: "flag_false" },
      { line: 7, text: "/* Remainder Section */", type: "code", phase: "remainder" }
    ],
    theory: "Peterson's algorithm is a classic software-based solution to the critical section problem for two processes. It provably satisfies all three requirements: Mutual Exclusion (both cannot be in CS simultaneously), Progress (no deadlock when both want in), and Bounded Waiting (neither waits indefinitely)."
  }
};

