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

package org.apache.myfaces.tobago.convert;

import org.apache.myfaces.tobago.util.LocaleUtils;

import jakarta.faces.component.UIComponent;
import jakarta.faces.context.FacesContext;
import jakarta.faces.convert.Converter;
import jakarta.faces.convert.ConverterException;
import java.util.Locale;

@org.apache.myfaces.tobago.apt.annotation.Converter(forClass = "java.util.Locale")
public class LocaleConverter implements Converter<Locale> {


  @Override
  public Locale getAsObject(
      final FacesContext facesContext, final UIComponent component, final String value) {
    final Locale locale = LocaleUtils.createLocale(value);
    if (locale == null) {
      throw new ConverterException("Can't parse " + value + " to a locale.");
    }
    return locale;
  }

  @Override
  public String getAsString(
      final FacesContext facesContext, final UIComponent component, final Locale locale) {
    return locale.toString();
  }

}
