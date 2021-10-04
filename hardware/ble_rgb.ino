#include <Arduino.h>
#include <SoftwareSerial.h>
#include <TimerOne.h>
#include "SerialCommands.h"


SoftwareSerial bleSerial(2,4); // RX, TX

int r_pin = 3;
int g_pin = 5;
int b_pin = 6;

volatile uint8_t current_r, current_g, current_b;
volatile uint8_t target_r, target_g, target_b;


char serialCommandBuffer[32];
SerialCommands serialCommands(&bleSerial, serialCommandBuffer, sizeof(serialCommandBuffer), "\r\n", " ");

void cmdUnrecognized(SerialCommands* sender, const char* cmd)
{
  Serial.print("Unrecognized command: ");
  Serial.println(cmd);
}

// directly
void writeRGB(uint8_t r, uint8_t g, uint8_t b) {
  current_r = r;
  current_g = g;
  current_b = b;
  
  analogWrite(r_pin, 255-r);
  analogWrite(g_pin, 255-g);
  analogWrite(b_pin, 255-b);
}

// With fade
void setRGB(uint8_t r, uint8_t g, uint8_t b) {
  target_r = r;
  target_g = g;
  target_b = b;
}

void myISR() {
  if (target_r > current_r) current_r++;
  else if (target_r < current_r) current_r--;

    if (target_g > current_g) current_g++;
  else if (target_g < current_g) current_g--;

    if (target_b > current_b) current_b++;
  else if (target_b < current_b) current_b--;

    analogWrite(r_pin, 255-current_r);
  analogWrite(g_pin, 255-current_g);
  analogWrite(b_pin, 255-current_b);
}

void cmdLedRgbFn(SerialCommands* sender)
{
  char* led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
  }
  uint8_t r = atoi(led_str);

  led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
  }
  uint8_t g = atoi(led_str);

  led_str = sender->Next();
  if (led_str == NULL) {
    Serial.println("Invalid LED RGB command");
  }
  uint8_t b = atoi(led_str);

  Serial.print("RGB ");
  Serial.print(r);
  Serial.print(" ");
  Serial.print(g);
  Serial.print(" ");
  Serial.println(b);
  setRGB(r, g, b);
}

SerialCommand cmdRgbLed("RGB", cmdLedRgbFn);

void setup()
{
  // Open serial communications and wait for port to open:
  Serial.begin(115200);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for Native USB only
  }


  Serial.println("Hello World!");

  // set the data rate for the SoftwareSerial port
  bleSerial.begin(9600);
  while (!bleSerial);

  serialCommands.SetDefaultHandler(cmdUnrecognized);
  serialCommands.AddCommand(&cmdRgbLed);

  writeRGB(255,0,0);
  delay(500);
  writeRGB(0,255,0);
  delay(500);
  writeRGB(0,0,255);
  delay(500);
  writeRGB(255,255,255);

  Timer1.initialize(1000);
  Timer1.attachInterrupt(myISR);
}

void loop() // run over and over
{
  serialCommands.ReadSerial();
//  if (bleSerial.available())
//    Serial.write(bleSerial.read());
  if (Serial.available())
    bleSerial.write(Serial.read());
}
