/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.apache.myfaces.tobago.example.addressbook;


import java.util.Enumeration;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.Appender;
import org.apache.logging.log4j.core.LoggerContext;
import org.apache.logging.log4j.core.config.Configuration;

public class Log4jUtils {

  public static Set<Appender> getAllAppenders() {
    return getAllAppenders(((LoggerContext) LogManager.getContext(false)).getConfiguration());
  }

  /**
   * @return all appenders currently in use
   * @param configuration
   */
  public static Set<Appender> getAllAppenders(final Configuration configuration) {
    Map<String, Appender> appenders = configuration.getAppenders();
    return new HashSet<Appender>(appenders.values());
//    final Enumeration loggers = configuration.getCurrentLoggers();
//      final Set<Appender> allAppenders = getAllAppenders(loggers);
//      addAppenders(configuration.getRootLogger(), allAppenders);
//      return allAppenders;
  }

  public static Set<Appender> getAllAppenders(final Enumeration loggers) {
      final Set<Appender> allAppenders = new HashSet<Appender>();
      while (loggers.hasMoreElements()) {
          final Logger logger = (Logger) loggers.nextElement();
          addAppenders(logger, allAppenders);
      }
      return allAppenders;
  }

  private static void addAppenders(final Logger logger, final Set<Appender> allAppenders) {
//      final Enumeration appenders = logger.getAllAppenders();
//      while (appenders.hasMoreElements()) {
//          final Appender appender = (Appender) appenders.nextElement();
//          allAppenders.add(appender);
//      }
  }

//  public static FileAppender getFileAppender(final String name, final LoggerRepository repository) {
//      final Set allAppenders = getAllAppenders(repository);
//    for (final Object allAppender : allAppenders) {
//      final Appender appender = (Appender) allAppender;
//      if (appender instanceof FileAppender) {
//        final FileAppender fileAppender = (FileAppender) appender;
//        if (fileAppender.getName() != null
//            && fileAppender.getName().equals(name)) {
//          return fileAppender;
//        }
//      }
//    }
//    return null;
//  }

}
